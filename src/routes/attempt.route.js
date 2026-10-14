// backend/src/routes/attempt.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const attemptValidation = require('../validations/attempt.validation');
const attemptController = require('../controllers/attempt.controller');

const router = express.Router();

// ✅ 1. My attempts — MUST be before /:attemptId
router.get('/my-attempts', auth(), attemptController.getAttempts);

// ✅ 2. Static sub-routes — MUST be before /:attemptId
router.get(
  '/exam/:examId',
  auth('getAttempts'),
  validate(attemptValidation.getAttemptsByExam),
  attemptController.getAttemptsByExam
);

router.get(
  '/student/:studentId',
  auth('getAttempts'),
  validate(attemptValidation.getAttemptsByStudent),
  attemptController.getAttemptsByStudent
);

// ✅ 3. List all attempts (admin/teacher)
router.get('/', auth('getAttempts'), attemptController.getAttempts);

// ✅ 4. Teacher grades written part (BEFORE /:attemptId)
router.patch(
  '/:attemptId/grade-written',
  auth('manageAttempts'),
  validate(attemptValidation.gradeWritten),
  attemptController.gradeWritten
);

// ✅ 5. Dynamic :attemptId routes — MUST be LAST
router
  .route('/:attemptId')
  .get(
    auth('getAttempts'),
    validate(attemptValidation.getAttempt),
    attemptController.getAttempt
  )
  .delete(
    auth('manageAttempts'),
    validate(attemptValidation.deleteAttempt),
    attemptController.deleteAttempt
  );

module.exports = router;