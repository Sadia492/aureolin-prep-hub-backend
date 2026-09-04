const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const examValidation = require('../validations/exam.validation');
const examController = require('../controllers/exam.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageExams'),
    validate(examValidation.createExam),
    examController.createExam
  )
  .get(
    auth('getExams'),
    examController.getExams
  );

router
  .route('/:examId')
  .get(
    auth('getExams'),
    examController.getExam
  )
  .patch(
    auth('manageExams'),
    validate(examValidation.updateExam),
    examController.updateExam
  )
  .delete(
    auth('manageExams'),
    examController.deleteExam
  );

router.post(
  '/:examId/questions',
  auth('manageExams'),
  validate(examValidation.addQuestion),
  examController.addQuestion
);

router.delete(
  '/:examId/questions/:questionId',
  auth('manageExams'),
  validate(examValidation.removeQuestion),
  examController.removeQuestion
);

module.exports = router;
