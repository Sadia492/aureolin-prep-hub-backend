// backend/src/routes/exam.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const examValidation = require('../validations/exam.validation');
const examController = require('../controllers/exam.controller');

const router = express.Router();

// ✅ Public/authenticated list & create
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

// ✅ Student actions — MUST come before /:examId
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

// ✅ Standard CRUD
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