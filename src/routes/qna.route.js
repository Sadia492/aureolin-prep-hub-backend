// backend/src/routes/qna.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const qnaValidation = require('../validations/qna.validation');
const qnaController = require('../controllers/qna.controller');
const fileUploader = require('../utils/fileUploader');
const multer = require('multer');

const router = express.Router();

// Create QnA with image upload
router.post(
  '/',
  auth('createQnAs'),
  fileUploader.upload.array('images', 5),
  async (req, res, next) => {
    try {
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await fileUploader.uploadToCloudinary(file);
          imageUrls.push(result.secure_url);
        }
      }
      req.body.images = imageUrls;
      next();
    } catch (error) {
      next(error);
    }
  },
  validate(qnaValidation.createQnA),
  qnaController.createQnA
);

router
  .route('/')
  .get(
    auth('getQnAs'),
    validate(qnaValidation.getQnAs),
    qnaController.getQnAs
  );

router
  .route('/:qnaId')
  .get(
    auth('getQnAs'),
    validate(qnaValidation.getQnA),
    qnaController.getQnA
  )
  .patch(
    auth('manageQnAs'),
    validate(qnaValidation.updateQnA),
    qnaController.updateQnA
  )
  .delete(
    auth('manageQnAs'),
    validate(qnaValidation.deleteQnA),
    qnaController.deleteQnA
  );

// ✅ Fix: Answer route with proper FormData handling
router.patch(
  '/:qnaId/answer',
  auth('answerQnAs'),
  (req, res, next) => {
    // Use multer directly to handle multipart form data
    const upload = fileUploader.upload.array('answerImages', 5);
    
    upload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Process uploaded images
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        // Upload images to Cloudinary
        Promise.all(req.files.map(async (file) => {
          const result = await fileUploader.uploadToCloudinary(file);
          return result.secure_url;
        }))
        .then((urls) => {
          // Add image URLs to request body
          req.body.answerImages = urls;
          
          // Extract answer from request body (form data)
          req.body.answer = req.body.answer;
          
          next();
        })
        .catch((error) => {
          next(error);
        });
      } else {
        // No images, just pass the answer
        req.body.answer = req.body.answer;
        req.body.answerImages = [];
        next();
      }
    });
  },
  validate(qnaValidation.answerQnA),
  qnaController.answerQnA
);

module.exports = router;