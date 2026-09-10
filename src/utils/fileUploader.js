// backend/src/utils/fileUploader.js
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs-extra');
const config = require('../config/config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

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
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ✅ Configure once
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
};

const uploadToCloudinary = async (file, folder = 'aureolin-materials') => {
  configureCloudinary();

  try {
    // ✅ PDFs need resource_type: 'raw'
    const isPdf = file.mimetype === 'application/pdf';
    const resourceType = isPdf ? 'raw' : 'image';

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      public_id: path.parse(file.filename).name,
      folder: folder,
      resource_type: resourceType,
    });

    // Remove local temp file
    await fs.remove(file.path);

    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (await fs.pathExists(file.path)) {
      await fs.remove(file.path);
    }
    throw error;
  }
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