const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const questionValidation = require('../validations/question.validation');
const questionController = require('../controllers/question.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageQuestions'),
    validate(questionValidation.createQuestion),
    questionController.createQuestion
  )
  .get(
    auth('getQuestions'),
    questionController.getQuestions
  );

router
  .route('/:questionId')
  .get(
    auth('getQuestions'),
    questionController.getQuestion
  )
  .patch(
    auth('manageQuestions'),
    validate(questionValidation.updateQuestion),
    questionController.updateQuestion
  )
  .delete(
    auth('manageQuestions'),
    questionController.deleteQuestion
  );

module.exports = router;
