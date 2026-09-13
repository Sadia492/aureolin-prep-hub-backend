// backend/src/utils/fileUploader.js
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const config = require('../config/config');

// ✅ MEMORY storage — no disk writes, works everywhere
const storage = multer.memoryStorage();

// ✅ File filter — only PDF + images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ✅ Configure once
const configureCloudinary = () => {
  // Fail fast with a clear message if env vars are missing
  if (
    !config.cloudinary?.cloudName ||
    !config.cloudinary?.apiKey ||
    !config.cloudinary?.apiSecret
  ) {
    throw new Error(
      'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
};

/**
 * Upload file to Cloudinary using a stream (works with memory storage).
 * @param {Express.Multer.File} file
 * @param {string} folder — Cloudinary folder
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = async (file, folder = 'aureolin-materials') => {
  configureCloudinary();

  if (!file?.buffer) {
    throw new Error('uploadToCloudinary: file.buffer is required (use memoryStorage).');
  }

  // ✅ PDFs need resource_type: 'raw'
  const isPdf = file.mimetype === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Keep the file extension so PDFs open in browser
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

// ✅ Delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  configureCloudinary();
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

const fileUploader = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
};

module.exports = fileUploader;