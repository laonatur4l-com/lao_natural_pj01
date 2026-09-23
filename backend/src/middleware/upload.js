import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

// Multer configuration — stores files in memory (Buffer) for upload to Supabase Storage
const storage = multer.memoryStorage();

// File filter — allow all image types including mobile formats (JPEG, PNG, GIF, WebP, HEIC, HEIF)
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || /heic|heif|jpg|jpeg|png|gif|webp/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, HEIC) are allowed.'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10) * 1024 * 1024;

// Multer instance for single image uploads
export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
});

/**
 * Upload a file buffer to Supabase Storage.
 */
export const uploadToStorage = async (buffer, bucket, filename, mimetype) => {
  const filePath = `${Date.now()}_${filename}`;

  let { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimetype || 'image/jpeg',
      upsert: true,
    });

  // If bucket not found, create public bucket dynamically and retry upload
  if (error && (error.message?.includes('not found') || error.statusCode === '404' || error.code === 'NoSuchBucket')) {
    await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {});
    const retry = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimetype || 'image/jpeg',
        upsert: true,
      });
    data = retry.data;
    error = retry.error;
  }

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
