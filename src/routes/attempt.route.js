// backend/src/routes/attempt.route.js
const express = require('express');
const auth = require('../middleware/auth');
const attemptController = require('../controllers/attempt.controller');

const router = express.Router();

// ✅ 1. My attempts — MUST be before /:attemptId
router.get('/my-attempts', auth(), attemptController.getAttempts);

// ✅ 2. Static sub-routes — MUST be before /:attemptId
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

// ✅ 3. List all attempts (admin/teacher)
router.get('/', auth('getAttempts'), attemptController.getAttempts);

// ✅ 4. Dynamic :attemptId routes — MUST be LAST
router
  .route('/:attemptId')
  .get(auth('getAttempts'), attemptController.getAttempt)
  .delete(auth('manageAttempts'), attemptController.deleteAttempt);

module.exports = router;