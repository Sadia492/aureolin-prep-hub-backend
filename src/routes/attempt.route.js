// backend/src/routes/attempt.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const attemptValidation = require('../validations/attempt.validation');
const attemptController = require('../controllers/attempt.controller');

const router = express.Router();

// ✅ My attempts — MUST be before /:attemptId
router.get(
  '/my-attempts',
  auth(),
  (req, res, next) => {
    req.params.studentId = req.user.id;
    next();
  },
  attemptController.getAttemptsByStudent
);

router
  .route('/')
  .post(
    auth('createAttempts'),
    validate(attemptValidation.createAttempt),
    attemptController.createAttempt
  )
  .get(
    auth('getAttempts'),
    attemptController.getAttempts
  );

router
  .route('/:attemptId')
  .get(
    auth('getAttempts'),
    attemptController.getAttempt
  )
  .delete(
    auth('manageAttempts'),
    attemptController.deleteAttempt
  );

router.get(
  '/exam/:examId',
  auth('getAttempts'),
  attemptController.getAttemptsByExam
);

router.get(
  '/student/:studentId',
  auth('getAttempts'),
  attemptController.getAttemptsByStudent
);

module.exports = router;