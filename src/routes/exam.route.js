// backend/src/routes/exam.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const examValidation = require('../validations/exam.validation');
const examController = require('../controllers/exam.controller');

const router = express.Router();

// ===== Exam CRUD =====
router
  .route('/')
  .post(
    auth('manageExams'),
    validate(examValidation.createExam),
    examController.createExam
  )
  .get(
    auth('getExams'),
    validate(examValidation.getExams),
    examController.getExams
  );

// ===== Teacher/Admin: Attempts list + grading (BEFORE /:examId) =====
router.get(
  '/attempts',
  auth('manageExams'),
  examController.getAttempts
);

router.patch(
  '/attempts/:attemptId/grade-written',
  auth('manageExams'),
  validate(examValidation.gradeWritten),
  examController.gradeWritten
);

// ===== Student actions (BEFORE /:examId) =====
router.get(
  '/:examId/start',
  auth('takeExams'),
  validate(examValidation.getExam),
  examController.startExam
);

router.post(
  '/:examId/submit',
  auth('takeExams'),
  validate(examValidation.submitExam),
  examController.submitExam
);

router.post(
  '/:examId/save-draft',
  auth('takeExams'),
  validate(examValidation.saveDraft),
  examController.saveDraft
);

// ===== Standard CRUD on /:examId =====
router
  .route('/:examId')
  .get(
    auth('getExams'),
    validate(examValidation.getExam),
    examController.getExam
  )
  .patch(
    auth('manageExams'),
    validate(examValidation.updateExam),
    examController.updateExam
  )
  .delete(
    auth('manageExams'),
    validate(examValidation.deleteExam),
    examController.deleteExam
  );

module.exports = router;