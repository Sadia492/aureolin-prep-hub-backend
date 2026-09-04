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

const upload = multer({ storage: storage });

const uploadToCloudinary = async (file) => {
  // Configuration
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  try {
    // Upload an image
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      public_id: path.parse(file.filename).name,
      folder: 'taskflow-attachments',
    });
    
    // Remove file from local storage after upload
    await fs.remove(file.path);
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Attempt to remove local file even if upload fails
    if (await fs.pathExists(file.path)) {
      await fs.remove(file.path);
    }
    throw error;
  }
};

const fileUploader = {
  upload,
  uploadToCloudinary,
};

module.exports = fileUploader;
