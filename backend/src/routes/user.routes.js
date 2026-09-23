import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validate.js';
import { buildUpdateObject } from '../utils/helpers.js';

const router = express.Router();

/**
 * GET /api/user/profile
 * Returns profile info for current authenticated user
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, address, phone, express_company, profile_picture, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({ data: profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/**
 * PUT /api/user/profile
 * Updates profile details for current authenticated user
 */
router.put('/profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'express_company', 'profile_picture'];
    const updates = buildUpdateObject(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, address, phone, express_company, profile_picture')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update user profile.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      data: profile,
    });
  } catch (err) {
    console.error('Profile update exception:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

export default router;
