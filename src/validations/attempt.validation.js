// backend/src/validations/attempt.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const answerSchema = Joi.object().keys({
  question: Joi.string().custom(objectId).required(),
  selectedOption: Joi.number().integer().min(0).max(3).allow(null),
});

const createAttempt = {
  body: Joi.object().keys({
    exam: Joi.string().custom(objectId).required(),
    answers: Joi.array().items(answerSchema).default([]),
    chosenOptionalSubjects: Joi.array().items(Joi.string()).default([]),
    student: Joi.string().custom(objectId), // optional, only for admins
  }),
};

module.exports = {
  createAttempt,
};