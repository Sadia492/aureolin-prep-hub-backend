const Joi = require('joi');
const { objectId } = require('./custom.validation');

const answerSchema = Joi.object().keys({
  question: Joi.string().custom(objectId).required(),
  selectedOption: Joi.number().min(0).allow(null),
});

const createAttempt = {
  body: Joi.object().keys({
    exam: Joi.string().custom(objectId).required(),
    answers: Joi.array().items(answerSchema),
    student: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createAttempt,
};
