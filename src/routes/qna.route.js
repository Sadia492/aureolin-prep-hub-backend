const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const qnaValidation = require('../validations/qna.validation');
const qnaController = require('../controllers/qna.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth('createQnAs'),
    validate(qnaValidation.createQnA),
    qnaController.createQnA
  )
  .get(
    auth('getQnAs'),
    qnaController.getQnAs
  );

router
  .route('/:qnaId')
  .get(
    auth('getQnAs'),
    qnaController.getQnA
  )
  .patch(
    auth('manageQnAs'),
    validate(qnaValidation.updateQnA),
    qnaController.updateQnA
  )
  .delete(
    auth('manageQnAs'),
    qnaController.deleteQnA
  );

router.patch(
  '/:qnaId/answer',
  auth('answerQnAs'),
  validate(qnaValidation.answerQnA),
  qnaController.answerQnA
);

module.exports = router;
