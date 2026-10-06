import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { upload, uploadToStorage, deleteFromStorage } from '../middleware/upload.js';
import { logActivity } from '../utils/helpers.js';
import { mockDistributors } from '../utils/mockData.js';

const router = express.Router();

// Helper to extract uploaded file from any field name ('logo', 'image', 'file')
const extractFile = (req) => {
  if (req.file) return req.file;
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === 'object') {
    return req.files.logo?.[0] || req.files.image?.[0] || req.files.file?.[0] || Object.values(req.files)[0]?.[0];
  }
  return null;
};

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
 * Helper to handle distributor creation or update
 */
const handleSaveDistributor = async (req, res) => {
  try {
    const file = extractFile(req);
    const id = req.params.id || req.body?.id;
    const { name, address, map_url, facebook_url, website_url, phone } = req.body;

    if (!name && !id) {
      return res.status(400).json({ error: 'Distributor name is required.' });
    }

    // UPDATE FLOW
    if (id) {
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

      if (file) {
        const filename = `distributor_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const result = await uploadToStorage(file.buffer, 'distributors', filename, file.mimetype);
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
      return res.json({ message: 'Collaborator updated successfully.', data: updatedDistributor });
    }

    // CREATE FLOW
    let imageUrl = null;
    if (file) {
      const filename = `distributor_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const result = await uploadToStorage(file.buffer, 'distributors', filename, file.mimetype);
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
      return res.status(500).json({ error: error.message || 'Failed to create distributor.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created distributor: ${name}`);

    res.status(201).json({
      message: 'Collaborator created successfully.',
      id: distributor.id,
      image_url: distributor.image_url,
      data: distributor,
    });
  } catch (err) {
    console.error('Save distributor error:', err);
    res.status(500).json({ error: err.message || 'Server error saving distributor.' });
  }
};

router.post('/', authenticate, authorize('owner', 'employee'), upload.any(), handleSaveDistributor);
router.post('/create', authenticate, authorize('owner', 'employee'), upload.any(), handleSaveDistributor);
router.post('/update', authenticate, authorize('owner', 'employee'), upload.any(), handleSaveDistributor);
router.put('/', authenticate, authorize('owner', 'employee'), upload.any(), handleSaveDistributor);
router.put('/:id', authenticate, authorize('owner', 'employee'), upload.any(), handleSaveDistributor);

/**
 * Universal delete distributor handler
 */
const handleDeleteDistributor = async (req, res) => {
  try {
    const id = req.params.id || req.body?.id || req.query?.id;

    if (!id) {
      return res.status(400).json({ error: 'Distributor ID is required.' });
    }

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
};

router.delete('/:id', authenticate, authorize('owner', 'employee'), handleDeleteDistributor);
router.delete('/', authenticate, authorize('owner', 'employee'), handleDeleteDistributor);
router.post('/delete', authenticate, authorize('owner', 'employee'), handleDeleteDistributor);

export default router;
