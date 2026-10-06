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

const handleUpdateCategory = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const { name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Category ID and name are required.' });
    }

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
};

router.put('/', authenticate, authorize('owner', 'employee'), validateCategory, handleUpdateCategory);
router.put('/:id', authenticate, authorize('owner', 'employee'), validateCategory, handleUpdateCategory);

/**
 * DELETE /api/categories/:id or DELETE /api/categories
 * Delete category (Staff/Owner only)
 */
const handleDeleteCategory = async (req, res) => {
  try {
    const id = req.params.id || req.body?.id || req.query?.id;

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required.' });
    }

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
};

router.delete('/', authenticate, authorize('owner', 'employee'), handleDeleteCategory);
router.delete('/:id', authenticate, authorize('owner', 'employee'), handleDeleteCategory);

export default router;
