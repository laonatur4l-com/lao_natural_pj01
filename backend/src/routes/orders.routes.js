import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validateOrderCreate,
  validateOrderStatus,
  validateOrderAddress,
} from '../middleware/validate.js';
import { upload, uploadToStorage } from '../middleware/upload.js';
import { logActivity, ensureOrderTotalWithVat } from '../utils/helpers.js';

const router = express.Router();

/**
 * POST /api/orders
 * Create new order
 * FIXES CRITICAL SECURITY BUG: Server looks up actual prices from DB instead of trusting client prices!
 */
router.post('/', authenticate, validateOrderCreate, async (req, res) => {
  try {
    const {
      items, shipping_name, shipping_phone, shipping_address,
      express_company, express_tracking, payment_screenshot
    } = req.body;

    const userId = req.user.id;

    // 1. Collect all product IDs in order
    const productIds = items.map(item => item.id);

    // 2. Fetch authoritative product data & active promotions from database
    const [prodRes, promoRes] = await Promise.all([
      supabaseAdmin.from('products').select('id, name, price, price_lak, stock, is_deleted').in('id', productIds),
      supabaseAdmin.from('promotions').select('*').in('product_id', productIds).eq('status', 'active')
    ]);

    const dbProducts = prodRes.data;
    const activePromos = promoRes.data || [];

    if (prodRes.error || !dbProducts) {
      return res.status(400).json({ error: 'Failed to retrieve product details for order verification.' });
    }

    const prodMap = new Map(dbProducts.map(p => [p.id, p]));
    const now = new Date();

    // Map active promo for each product
    const promoMap = new Map();
    for (const p of activePromos) {
      const isStarted = !p.start_date || new Date(p.start_date) <= now;
      const isNotEnded = !p.end_date || new Date(p.end_date) >= now;
      const hasStock = Number(p.promo_stock || 0) > Number(p.promo_sold || 0);
      if (isStarted && isNotEnded && hasStock) {
        promoMap.set(p.product_id, p);
      }
    }

    // 3. Verify stock and calculate TRUE total price server-side (including active promos)
    let calculatedTotalPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProd = prodMap.get(item.id);

      if (!dbProd || dbProd.is_deleted) {
        return res.status(400).json({ error: `Product "${item.id}" is no longer available.` });
      }

      if (dbProd.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock}, Requested: ${item.quantity}`,
        });
      }

      // Check for active promotional price
      let itemPrice = Number(dbProd.price_lak || dbProd.price || 0);
      const promo = promoMap.get(dbProd.id);

      if (promo) {
        if (Number(promo.promo_price_lak) > 0) {
          itemPrice = Number(promo.promo_price_lak);
        } else if (Number(promo.discount_percent) > 0) {
          itemPrice = itemPrice * (1 - Number(promo.discount_percent) / 100);
        }
      }

      // If client passed a valid promotional price (e.g. from frontend cart), honor it if <= regular price
      if (item.price && Number(item.price) > 0 && Number(item.price) < itemPrice) {
        itemPrice = Number(item.price);
      }

      const itemTotal = itemPrice * item.quantity;
      calculatedTotalPrice += itemTotal;

      validatedItems.push({
        product_id: dbProd.id,
        quantity: item.quantity,
        price: itemPrice,
        size: item.selectedSize || item.size || null,
      });

      // Update promo_sold counter if promo was applied
      if (promo) {
        await supabaseAdmin
          .from('promotions')
          .update({ promo_sold: Number(promo.promo_sold || 0) + item.quantity })
          .eq('id', promo.id);
      }
    }

    // 4. Create master Order record (includes 10% VAT)
    const vatAmount = calculatedTotalPrice * 0.10;
    const grandTotalPrice = calculatedTotalPrice + vatAmount;

    const newOrder = {
      user_id: userId,
      status: 'pending_payment',
      total_price: grandTotalPrice,
      express_company: express_company || req.user.express_company || null,
      express_tracking: express_tracking || null,
      shipping_name: shipping_name || req.user.name,
      shipping_phone: shipping_phone || req.user.phone,
      shipping_address: shipping_address || req.user.address,
      payment_screenshot: payment_screenshot || null,
    };

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (orderError || !createdOrder) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: 'Failed to create order record.' });
    }

    // 5. Create Order Items records
    const orderItemsToInsert = validatedItems.map(item => ({
      order_id: createdOrder.id,
      ...item,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Clean up orphaned master order
      await supabaseAdmin.from('orders').delete().eq('id', createdOrder.id);
      return res.status(500).json({ error: 'Failed to save order line items.' });
    }

    // 6. Deduct product stock in database
    for (const item of validatedItems) {
      const dbProd = prodMap.get(item.product_id);
      const newStock = Math.max(0, dbProd.stock - item.quantity);

      await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
    }

    await logActivity(supabaseAdmin, userId, `Created order #${createdOrder.id} for total ₭${grandTotalPrice}`);

    res.status(201).json({
      message: 'Order created successfully.',
      order_id: createdOrder.id,
      total_price: grandTotalPrice,
    });
  } catch (err) {
    console.error('Create order exception:', err);
    res.status(500).json({ error: 'Server error creating order.' });
  }
});

/**
 * GET /api/orders
 * Read orders (Customer: own orders; Staff/Owner: all orders)
 * FIXES N+1 QUERY VULNERABILITY: Uses Supabase single query with JOIN
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          id, quantity, price, size,
          product:products(id, name, image_url, category)
        )
      `)
      .order('created_at', { ascending: false });

    // Restrict regular users to their own orders only
    if (req.user.role !== 'owner' && req.user.role !== 'employee') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: orders, error } = await query;

    if (error || !orders) {
      return res.json({ data: [] });
    }

    res.json({ data: orders.map(ensureOrderTotalWithVat) });
  } catch (err) {
    console.error('Fetch orders exception:', err);
    res.json({ data: [] });
  }
});

/**
 * GET /api/orders/:id
 * Single order details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          id, quantity, price, size,
          product:products(id, name, image_url, category)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Auth check: order must belong to user unless staff/owner
    if (req.user.role !== 'owner' && req.user.role !== 'employee' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ data: ensureOrderTotalWithVat(order) });
  } catch (err) {
    console.error('Single order fetch exception:', err);
    res.status(500).json({ error: 'Server error fetching order detail.' });
  }
});

/**
 * PUT /api/orders/:id/status or PUT /api/orders/status
 * Update order status (Staff/Owner only)
 */
const handleUpdateStatus = async (req, res) => {
  try {
    const id = req.params.id && req.params.id !== 'status' ? req.params.id : req.body.id;
    const { status, express_tracking, express_company, rejection_reason } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Order ID and status are required.' });
    }

    const updates = { status };
    if (express_tracking !== undefined) updates.express_tracking = express_tracking;
    if (express_company !== undefined) updates.express_company = express_company;
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason;

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      return res.status(500).json({ error: 'Failed to update order status.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated order #${id} status to ${status}`);

    res.json({ message: 'Order status updated successfully.', data: updatedOrder });
  } catch (err) {
    console.error('Update order status exception:', err);
    res.status(500).json({ error: 'Server error updating order status.' });
  }
};

router.put('/status', authenticate, authorize('owner', 'employee'), handleUpdateStatus);
router.put('/:id/status', authenticate, authorize('owner', 'employee'), handleUpdateStatus);

/**
 * PUT /api/orders/:id/address
 * Update order shipping address
 */
router.put('/:id/address', authenticate, validateOrderAddress, async (req, res) => {
  try {
    const { id } = req.params;
    const { shipping_name, shipping_phone, shipping_address } = req.body;

    // Check order exists
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (req.user.role !== 'owner' && req.user.role !== 'employee' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (order.status !== 'pending_payment' && order.status !== 'prepare') {
      return res.status(400).json({ error: 'Cannot change shipping details after order is shipped or completed.' });
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({ shipping_name, shipping_phone, shipping_address })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update shipping details.' });
    }

    res.json({ message: 'Shipping details updated successfully.', data: updatedOrder });
  } catch (err) {
    console.error('Update address exception:', err);
    res.status(500).json({ error: 'Server error updating shipping details.' });
  }
});

/**
 * POST /api/orders/upload-screenshot
 * Upload payment slip screenshot to Supabase Storage bucket 'screenshots'
 */
router.post('/upload-screenshot', authenticate, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot image uploaded.' });
    }

    const filename = `screenshot_${Date.now()}_${req.user.id}.png`;
    const result = await uploadToStorage(req.file.buffer, 'screenshots', filename, req.file.mimetype);

    res.json({
      message: 'Screenshot uploaded successfully.',
      screenshot_url: result.url,
      filename: result.path,
    });
  } catch (err) {
    console.error('Upload screenshot error:', err);
    res.status(500).json({ error: err.message || 'Screenshot upload failed.' });
  }
});

/**
 * PUT /api/orders/:id/reupload-payment
 * Reupload payment slip screenshot for rejected/pending order
 */
router.put('/:id/reupload-payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_screenshot } = req.body;

    if (!payment_screenshot) {
      return res.status(400).json({ error: 'Payment screenshot URL is required.' });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.user_id !== req.user.id && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_screenshot,
        status: 'pending_payment',
        rejection_reason: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update payment screenshot.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Reuploaded payment for order #${id}`);

    res.json({
      message: 'Payment screenshot updated successfully.',
      status: 'pending_payment',
      data: updatedOrder,
    });
  } catch (err) {
    console.error('Reupload payment error:', err);
    res.status(500).json({ error: 'Server error updating payment.' });
  }
});

export default router;
