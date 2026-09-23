import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validatePromotion } from '../middleware/validate.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

/**
 * GET /api/promotions
 * Public list of promotions
 */
router.get('/', async (req, res) => {
  try {
    const { data: promotions, error } = await supabaseAdmin
      .from('promotions')
      .select(`
        *,
        product:products(id, name, image_url, price, stock)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch promotions.' });
    }

    // Compute active status dynamically
    const now = new Date();
    const formattedPromotions = promotions.map(p => {
      let computedStatus = p.status;
      if (p.promo_stock <= p.promo_sold) computedStatus = 'exhausted';
      else if (p.start_date && new Date(p.start_date) > now) computedStatus = 'upcoming';
      else if (p.end_date && new Date(p.end_date) < now) computedStatus = 'expired';

      return {
        ...p,
        computed_status: computedStatus,
      };
    });

    res.json({ status: 'success', data: formattedPromotions });
  } catch (err) {
    console.error('Fetch promotions error:', err);
    res.status(500).json({ error: 'Server error loading promotions.' });
  }
});

/**
 * POST /api/promotions
 * Create new promotion (Staff/Owner)
 */
router.post('/', authenticate, authorize('owner', 'employee'), validatePromotion, async (req, res) => {
  try {
    const {
      product_id, title, type, discount_percent,
      promo_price_lak, promo_price_thb, promo_price_usd,
      promo_stock, buy_qty, get_qty, start_date, end_date,
    } = req.body;

    // Check target product stock
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .eq('id', product_id)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Target product not found.' });
    }

    const requestedPromoStock = parseInt(promo_stock, 10);
    const buyQuantity = parseInt(buy_qty || 1, 10);
    const getQuantity = parseInt(get_qty || 1, 10);

    // Business Logic Validation for B1G1
    if (type === 'b1g1') {
      const minSetSize = buyQuantity + getQuantity;
      if (product.stock < minSetSize) {
        return res.status(400).json({
          error: `Product stock (${product.stock}) is insufficient for B1G1 promotion (requires minimum ${minSetSize}).`,
        });
      }
    }

    const newPromotion = {
      product_id,
      title,
      type,
      discount_percent: parseFloat(discount_percent || 0),
      promo_price_lak: parseFloat(promo_price_lak || 0),
      promo_price_thb: parseFloat(promo_price_thb || 0),
      promo_price_usd: parseFloat(promo_price_usd || 0),
      promo_stock: requestedPromoStock,
      promo_sold: 0,
      buy_qty: buyQuantity,
      get_qty: getQuantity,
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'active',
    };

    const { data: promotion, error } = await supabaseAdmin
      .from('promotions')
      .insert(newPromotion)
      .select()
      .single();

    if (error) {
      console.error('Create promotion error:', error);
      return res.status(500).json({ error: 'Failed to create promotion.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created promotion "${title}" for product ${product_id}`);

    res.status(201).json({
      message: 'Promotion created successfully.',
      id: promotion.id,
      data: promotion,
    });
  } catch (err) {
    console.error('Create promotion exception:', err);
    res.status(500).json({ error: 'Server error creating promotion.' });
  }
});

/**
 * PUT /api/promotions/:id
 * Update promotion (Staff/Owner)
 */
router.put('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, status, discount_percent, promo_price_lak,
      promo_price_thb, promo_price_usd, promo_stock,
      buy_qty, get_qty, start_date, end_date,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;
    if (discount_percent !== undefined) updates.discount_percent = parseFloat(discount_percent);
    if (promo_price_lak !== undefined) updates.promo_price_lak = parseFloat(promo_price_lak);
    if (promo_price_thb !== undefined) updates.promo_price_thb = parseFloat(promo_price_thb);
    if (promo_price_usd !== undefined) updates.promo_price_usd = parseFloat(promo_price_usd);
    if (promo_stock !== undefined) updates.promo_stock = parseInt(promo_stock, 10);
    if (buy_qty !== undefined) updates.buy_qty = parseInt(buy_qty, 10);
    if (get_qty !== undefined) updates.get_qty = parseInt(get_qty, 10);
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;

    const { data: updatedPromo, error } = await supabaseAdmin
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update promotion.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated promotion #${id}`);

    res.json({ message: 'Promotion updated successfully.', data: updatedPromo });
  } catch (err) {
    console.error('Update promotion error:', err);
    res.status(500).json({ error: 'Server error updating promotion.' });
  }
});

/**
 * DELETE /api/promotions/:id
 * Delete promotion (Staff/Owner)
 */
router.delete('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete promotion.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Deleted promotion #${id}`);

    res.json({ message: 'Promotion deleted successfully.' });
  } catch (err) {
    console.error('Delete promotion error:', err);
    res.status(500).json({ error: 'Server error deleting promotion.' });
  }
});

export default router;
