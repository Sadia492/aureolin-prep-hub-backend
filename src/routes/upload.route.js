const express = require('express');
const auth = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('http-status').default;
const fileUploader = require('../utils/fileUploader');

const router = express.Router();

router.post(
  '/image',
  auth('manageExams'),   // only admin/teacher
  fileUploader.upload.single('image'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }
    const result = await fileUploader.uploadToCloudinary(
      req.file,
      'aureolin-exam-images'
    );
    res.send(
      new ApiResponse(
        httpStatus.OK,
        { url: result.secure_url, publicId: result.public_id },
        'Image uploaded'
      )
    );
  })
);

module.exports = router;