const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createExam = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    course: Joi.string().custom(objectId).required(),
    subject: Joi.string().required(),
    questions: Joi.array().items(Joi.string().custom(objectId)),
    duration: Joi.number().min(1).required(),
    totalMarks: Joi.number().min(0).required(),
    negativeMark: Joi.number().min(0),
    scheduledAt: Joi.date().required(),
  }),
};

const updateExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      course: Joi.string().custom(objectId),
      subject: Joi.string(),
      questions: Joi.array().items(Joi.string().custom(objectId)),
      duration: Joi.number().min(1),
      totalMarks: Joi.number().min(0),
      negativeMark: Joi.number().min(0),
      scheduledAt: Joi.date(),
    })
    .min(1),
};

const addQuestion = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    questionId: Joi.string().custom(objectId).required(),
  }),
};

const removeQuestion = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
    questionId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createExam,
  updateExam,
  addQuestion,
  removeQuestion,
};
