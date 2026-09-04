const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createQuestion = {
  body: Joi.object().keys({
    question: Joi.string().required(),
    options: Joi.array().items(Joi.string()).min(2).required(),
    correctAnswer: Joi.number().min(0).required(),
    explanation: Joi.string().allow(''),
    subject: Joi.string().required(),
  }),
};

const updateQuestion = {
  params: Joi.object().keys({
    questionId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string(),
      options: Joi.array().items(Joi.string()).min(2),
      correctAnswer: Joi.number().min(0),
      explanation: Joi.string().allow(''),
      subject: Joi.string(),
    })
    .min(1),
};

module.exports = {
  createQuestion,
  updateQuestion,
};
