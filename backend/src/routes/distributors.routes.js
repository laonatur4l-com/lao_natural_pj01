import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { upload, uploadToStorage, deleteFromStorage } from '../middleware/upload.js';
import { logActivity } from '../utils/helpers.js';
import { mockDistributors } from '../utils/mockData.js';

const router = express.Router();

/**
 * GET /api/distributors
 * Public list of partner distributors / collaborators
 */
router.get('/', async (req, res) => {
  try {
    const { data: distributors, error } = await supabaseAdmin
      .from('distributors')
      .select('*')
      .order('id', { ascending: false });

    if (error || !distributors || distributors.length === 0) {
      return res.json({ data: mockDistributors });
    }

    res.json({ data: distributors });
  } catch (err) {
    console.error('Fetch distributors error:', err);
    res.json({ data: mockDistributors });
  }
});

/**
 * POST /api/distributors
 * Create collaborator / distributor (Staff/Owner)
 */
router.post('/', authenticate, authorize('owner', 'employee'), upload.single('logo'), async (req, res) => {
  try {
    const { name, address, map_url, facebook_url, website_url, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Distributor name is required.' });
    }

    let imageUrl = null;
    if (req.file) {
      const filename = `distributor_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const result = await uploadToStorage(req.file.buffer, 'distributors', filename, req.file.mimetype);
      imageUrl = result.url;
    }

    const newDistributor = {
      name,
      address: address || null,
      image_url: imageUrl,
      map_url: map_url || null,
      facebook_url: facebook_url || null,
      website_url: website_url || null,
      phone: phone || null,
    };

    const { data: distributor, error } = await supabaseAdmin
      .from('distributors')
      .insert(newDistributor)
      .select()
      .single();

    if (error) {
      console.error('Create distributor error:', error);
      return res.status(500).json({ error: 'Failed to create distributor.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created distributor: ${name}`);

    res.status(201).json({
      message: 'Collaborator created successfully.',
      id: distributor.id,
      image_url: distributor.image_url,
      data: distributor,
    });
  } catch (err) {
    console.error('Create distributor error:', err);
    res.status(500).json({ error: err.message || 'Server error creating distributor.' });
  }
});

/**
 * PUT /api/distributors/:id
 * Update distributor details (Staff/Owner)
 */
router.put('/:id', authenticate, authorize('owner', 'employee'), upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, map_url, facebook_url, website_url, phone } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('distributors')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Distributor not found.' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (map_url !== undefined) updates.map_url = map_url;
    if (facebook_url !== undefined) updates.facebook_url = facebook_url;
    if (website_url !== undefined) updates.website_url = website_url;
    if (phone !== undefined) updates.phone = phone;

    if (req.file) {
      const filename = `distributor_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const result = await uploadToStorage(req.file.buffer, 'distributors', filename, req.file.mimetype);
      updates.image_url = result.url;

      if (existing.image_url) {
        await deleteFromStorage('distributors', existing.image_url);
      }
    }

    const { data: updatedDistributor, error } = await supabaseAdmin
      .from('distributors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update distributor.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Updated distributor #${id}`);

    res.json({ message: 'Collaborator updated successfully.', data: updatedDistributor });
  } catch (err) {
    console.error('Update distributor error:', err);
    res.status(500).json({ error: 'Server error updating distributor.' });
  }
});

/**
 * DELETE /api/distributors/:id
 * Delete distributor (Staff/Owner)
 */
router.delete('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: distributor } = await supabaseAdmin
      .from('distributors')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!distributor) {
      return res.status(404).json({ error: 'Distributor not found.' });
    }

    if (distributor.image_url) {
      await deleteFromStorage('distributors', distributor.image_url);
    }

    await supabaseAdmin.from('distributors').delete().eq('id', id);
    await logActivity(supabaseAdmin, req.user.id, `Deleted distributor #${id}`);

    res.json({ message: 'Collaborator deleted successfully.' });
  } catch (err) {
    console.error('Delete distributor error:', err);
    res.status(500).json({ error: 'Server error deleting distributor.' });
  }
});

export default router;
