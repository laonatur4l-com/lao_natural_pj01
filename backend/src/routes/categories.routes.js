import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateCategory } from '../middleware/validate.js';
import { logActivity } from '../utils/helpers.js';
import { mockCategories } from '../utils/mockData.js';

const router = express.Router();

/**
 * GET /api/categories
 * Public list of all categories sorted alphabetically
 */
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error || !categories || categories.length === 0) {
      return res.json({ data: mockCategories });
    }

    res.json({ data: categories });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.json({ data: mockCategories });
  }
});

/**
 * POST /api/categories
 * Create new category (Staff/Owner only)
 */
router.post('/', authenticate, authorize('owner', 'employee'), validateCategory, async (req, res) => {
  try {
    const { name } = req.body;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation in Postgres
        return res.status(409).json({ error: 'Category with this name already exists.' });
      }
      return res.status(500).json({ error: 'Failed to create category.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created category: ${name}`);

    res.status(201).json({ message: 'Category created successfully.', data: category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Server error creating category.' });
  }
});

/**
 * PUT /api/categories/:id
 * Update category name (Staff/Owner only)
 */
router.put('/:id', authenticate, authorize('owner', 'employee'), validateCategory, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update category.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated category #${id} to "${name}"`);

    res.json({ message: 'Category updated successfully.', data: category });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Server error updating category.' });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete category (Staff/Owner only)
 */
router.delete('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete category.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Deleted category #${id}`);

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Server error deleting category.' });
  }
});

export default router;
