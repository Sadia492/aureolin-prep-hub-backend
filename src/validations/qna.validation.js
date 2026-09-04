const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createQnA = {
  body: Joi.object().keys({
    question: Joi.string().required(),
    subject: Joi.string().required(),
    student: Joi.string().custom(objectId),
  }),
};

const answerQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    answer: Joi.string().required(),
  }),
};

const updateQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string(),
      subject: Joi.string(),
      answer: Joi.string().allow(''),
      status: Joi.string().valid('pending', 'answered'),
    })
    .min(1),
};

module.exports = {
  createQnA,
  answerQnA,
  updateQnA,
};
