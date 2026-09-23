import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { upload, uploadToStorage, deleteFromStorage } from '../middleware/upload.js';
import { logActivity } from '../utils/helpers.js';
import { mockBanners } from '../utils/mockData.js';

const router = express.Router();

/**
 * GET /api/banners
 * Public list of hero & client banners
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;

    let query = supabaseAdmin
      .from('hero_banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (type && ['hero', 'client'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data: banners, error } = await query;

    if (error || !banners || banners.length === 0) {
      return res.json({ data: mockBanners });
    }

    res.json({ data: banners });
  } catch (err) {
    console.error('Fetch banners error:', err);
    res.json({ data: mockBanners });
  }
});

/**
 * POST /api/banners/upload
 * Upload banner image to Supabase Storage bucket 'banners' (Staff/Owner)
 */
router.post('/upload', authenticate, authorize('owner', 'employee'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const { title, subtitle, link_url, type } = req.body;
    const bannerType = type && ['hero', 'client'].includes(type) ? type : 'hero';

    const filename = `banner_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const result = await uploadToStorage(req.file.buffer, 'banners', filename, req.file.mimetype);

    const newBanner = {
      image_url: result.url,
      title: title || null,
      subtitle: subtitle || null,
      link_url: link_url || null,
      type: bannerType,
    };

    const { data: banner, error } = await supabaseAdmin
      .from('hero_banners')
      .insert(newBanner)
      .select()
      .single();

    if (error) {
      console.error('Banner DB insert error:', error);
      return res.status(500).json({ error: 'Failed to save banner record.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Uploaded new ${bannerType} banner #${banner.id}`);

    res.status(201).json({
      message: 'Banner uploaded successfully.',
      id: banner.id,
      image_url: banner.image_url,
      type: banner.type,
      data: banner,
    });
  } catch (err) {
    console.error('Upload banner error:', err);
    res.status(500).json({ error: err.message || 'Banner upload failed.' });
  }
});

/**
 * DELETE /api/banners/:id
 * Delete banner (Staff/Owner)
 */
router.delete('/:id', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: banner } = await supabaseAdmin
      .from('hero_banners')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found.' });
    }

    if (banner.image_url) {
      await deleteFromStorage('banners', banner.image_url);
    }

    await supabaseAdmin.from('hero_banners').delete().eq('id', id);
    await logActivity(supabaseAdmin, req.user.id, `Deleted banner #${id}`);

    res.json({ message: 'Banner deleted successfully.' });
  } catch (err) {
    console.error('Delete banner error:', err);
    res.status(500).json({ error: 'Server error deleting banner.' });
  }
});

export default router;
