// backend/src/validations/question.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const subjectEnum = [
  'Bangla', 'English', 'ICT',
  'Accounting', 'Business Organization', 'Economics', 'Statistics', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Higher Math',
];

const createQuestion = {
  body: Joi.object().keys({
    question: Joi.string().required(),
    options: Joi.array().items(Joi.string()).length(4).required(),
    correctAnswer: Joi.number().integer().min(0).max(3).required(),
    explanation: Joi.string().allow(''),
    subject: Joi.string().valid(...subjectEnum).required(),
    marks: Joi.number().min(1).default(1),
  }),
};

const updateQuestion = {
  params: Joi.object().keys({
    questionId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string(),
      options: Joi.array().items(Joi.string()).length(4),
      correctAnswer: Joi.number().integer().min(0).max(3),
      explanation: Joi.string().allow(''),
      subject: Joi.string().valid(...subjectEnum),
      marks: Joi.number().min(1),
    })
    .min(1),
};

module.exports = {
  createQuestion,
  updateQuestion,
};