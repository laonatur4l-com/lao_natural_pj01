import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

// Multer configuration — stores files in memory (Buffer) for upload to Supabase Storage
const storage = multer.memoryStorage();

// File filter — only allow image types
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '8', 10) * 1024 * 1024;

// Multer instance for single image uploads
export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
});

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param {Buffer} buffer - The file buffer
 * @param {string} bucket - Supabase Storage bucket name (e.g., 'products', 'banners')
 * @param {string} filename - Desired filename (e.g., 'product_abc123.png')
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<{url: string, path: string}>} The public URL and storage path
 */
export const uploadToStorage = async (buffer, bucket, filename, mimetype) => {
  const filePath = `${Date.now()}_${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
};

/**
 * Delete a file from Supabase Storage by its path.
 *
 * @param {string} bucket - Supabase Storage bucket name
 * @param {string} filePath - The storage path of the file
 */
export const deleteFromStorage = async (bucket, filePath) => {
  // Extract just the path portion if a full URL was passed
  if (filePath.startsWith('http')) {
    const url = new URL(filePath);
    // Supabase storage URLs follow pattern: /storage/v1/object/public/bucket/path
    const parts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
    if (parts.length > 1) {
      filePath = parts[1];
    }
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`Storage delete failed for ${filePath}:`, error.message);
  }
};

/**
 * Multer error handler middleware.
 * Place this after routes that use multer to catch file upload errors.
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 8}MB.`,
      });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message.includes('Only')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};
