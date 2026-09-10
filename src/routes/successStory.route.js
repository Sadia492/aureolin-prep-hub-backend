// backend/src/routes/successStory.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const successStoryValidation = require('../validations/successStory.validation');
const successStoryController = require('../controllers/successStory.controller');

const router = express.Router();

// ✅ Public route (no auth) — MUST be before /:storyId
router.get(
  '/public',
  validate(successStoryValidation.getPublicSuccessStories),
  successStoryController.getPublicSuccessStories
);

// Protected routes (admin only)
router
  .route('/')
  .post(
    auth('manageSuccessStories'),
    validate(successStoryValidation.createSuccessStory),
    successStoryController.createSuccessStory
  )
  .get(
    auth('getSuccessStories'),
    validate(successStoryValidation.getSuccessStories),
    successStoryController.getSuccessStories
  );

router
  .route('/:storyId')
  .get(
    auth('getSuccessStories'),
    validate(successStoryValidation.getSuccessStory),
    successStoryController.getSuccessStory
  )
  .patch(
    auth('manageSuccessStories'),
    validate(successStoryValidation.updateSuccessStory),
    successStoryController.updateSuccessStory
  )
  .delete(
    auth('manageSuccessStories'),
    validate(successStoryValidation.deleteSuccessStory),
    successStoryController.deleteSuccessStory
  );

module.exports = router;