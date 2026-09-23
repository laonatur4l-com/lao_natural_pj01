import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateProduct, validateProductUpdate } from '../middleware/validate.js';
import { upload, uploadToStorage } from '../middleware/upload.js';
import { buildUpdateObject, logActivity } from '../utils/helpers.js';
import { mockProducts } from '../utils/mockData.js';

const router = express.Router();

/**
 * Helper: Attach active promotion object to a product if applicable
 */
const attachPromotionsToProducts = async (products) => {
  if (!products || products.length === 0) return [];

  try {
    const { data: promotions } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('status', 'active');

    const promoMap = new Map();
    if (promotions) {
      for (const p of promotions) {
        if (p.start_date && new Date(p.start_date) > new Date()) continue;
        if (p.end_date && new Date(p.end_date) < new Date()) continue;
        if (p.promo_stock <= p.promo_sold) continue;

        promoMap.set(p.product_id, p);
      }
    }

    return products.map(prod => ({
      ...prod,
      promotion: promoMap.get(prod.id) || null,
    }));
  } catch {
    return products;
  }
};

/**
 * GET /api/products
 * Public list of products (excluding soft-deleted)
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: products, error } = await query;

    let finalProducts = products;
    if (error || !finalProducts || finalProducts.length === 0) {
      finalProducts = mockProducts;
      if (category && category !== 'All') {
        finalProducts = finalProducts.filter(p => p.category === category);
      }
      if (search) {
        finalProducts = finalProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      }
    }

    const productsWithPromos = await attachPromotionsToProducts(finalProducts);

    res.json({ data: productsWithPromos });
  } catch (err) {
    console.error('Products route error:', err);
    res.json({ data: mockProducts });
  }
});

/**
 * GET /api/products/popular
 * Public list of top 8 best-selling products
 */
router.get('/popular', async (req, res) => {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_deleted', false)
      .limit(8);

    if (error || !products || products.length === 0) {
      return res.json({ data: mockProducts.slice(0, 8) });
    }

    res.json({ data: products });
  } catch {
    res.json({ data: mockProducts.slice(0, 8) });
  }
});

/**
 * GET /api/products/:id
 * Single product detail endpoint
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product || product.is_deleted) {
      const mock = mockProducts.find(p => String(p.id) === String(id));
      if (mock) {
        const [mockWithPromo] = await attachPromotionsToProducts([mock]);
        return res.json({ data: mockWithPromo });
      }
      return res.status(404).json({ message: 'Product not found.' });
    }

    const [productWithPromo] = await attachPromotionsToProducts([product]);
    res.json({ data: productWithPromo });
  } catch (err) {
    console.error('Single product fetch error:', err);
    const mock = mockProducts.find(p => String(p.id) === String(id));
    if (mock) {
      return res.json({ data: mock });
    }
    res.status(500).json({ error: 'Server error loading product detail.' });
  }
});

/**
 * POST /api/products
 * Create product (Staff/Owner only)
 */
router.post('/', authenticate, authorize('owner', 'employee'), validateProduct, async (req, res) => {
  try {
    const {
      id, name, description, category, size, price,
      price_lak, price_thb, price_usd, import_price,
      import_price_lak, import_price_thb, import_price_usd,
      currency, import_currency, stock, image_url, ingredients,
    } = req.body;

    const productId = id || `PROD_${Date.now()}`;

    const newProduct = {
      id: productId,
      name,
      description: description || null,
      category: category || null,
      size: size || null,
      price: parseFloat(price) || 0,
      price_lak: parseFloat(price_lak) || parseFloat(price) || 0,
      price_thb: parseFloat(price_thb) || 0,
      price_usd: parseFloat(price_usd) || 0,
      import_price: parseFloat(import_price) || 0,
      import_price_lak: parseFloat(import_price_lak) || parseFloat(import_price) || 0,
      import_price_thb: parseFloat(import_price_thb) || 0,
      import_price_usd: parseFloat(import_price_usd) || 0,
      currency: currency || 'LAK',
      import_currency: import_currency || 'LAK',
      stock: parseInt(stock, 10) || 0,
      image_url: image_url || null,
      ingredients: ingredients || null,
      imported_by: req.user.id,
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(newProduct)
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return res.status(500).json({ error: 'Failed to create product.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created product: ${name} (${productId})`);

    res.status(201).json({ message: 'Product created successfully.', data });
  } catch (err) {
    console.error('Create product exception:', err);
    res.status(500).json({ error: 'Server error creating product.' });
  }
});

/**
 * PUT /api/products/:id
 * Update product (Staff/Owner only)
 */
router.put('/:id', authenticate, authorize('owner', 'employee'), validateProductUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'name', 'description', 'category', 'size', 'price',
      'price_lak', 'price_thb', 'price_usd', 'import_price',
      'import_price_lak', 'import_price_thb', 'import_price_usd',
      'currency', 'import_currency', 'stock', 'image_url', 'ingredients',
    ];

    const updates = buildUpdateObject(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update.' });
    }

    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return res.status(500).json({ error: 'Failed to update product.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated product: ${id}`);

    res.json({ message: 'Product was updated.', data: updatedProduct });
  } catch (err) {
    console.error('Update product exception:', err);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

/**
 * DELETE /api/products/:id
 * Soft delete product (Staff/Owner only)
 */
router.delete('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete product.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Deleted product: ${id}`);

    res.json({ message: 'Product was deleted.' });
  } catch (err) {
    console.error('Delete product exception:', err);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

/**
 * POST /api/products/upload-image
 * Upload product image to Supabase Storage bucket 'products'
 */
router.post('/upload-image', authenticate, authorize('owner', 'employee'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const filename = `product_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const result = await uploadToStorage(req.file.buffer, 'products', filename, req.file.mimetype);

    res.json({
      message: 'Image uploaded successfully.',
      image_url: result.url,
      filename: result.path,
    });
  } catch (err) {
    console.error('Upload product image error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed.' });
  }
});

export default router;
