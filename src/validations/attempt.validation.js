// backend/src/validations/attempt.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const answerSchema = Joi.object().keys({
  question: Joi.string().custom(objectId).required(),
  selectedOption: Joi.number().integer().min(0).max(3).allow(null),
});

const writtenAnswerSchema = Joi.object().keys({
  question: Joi.string().custom(objectId).required(),
  subject: Joi.string().optional(),
  answerText: Joi.string().allow('').default(''),
  answerImages: Joi.array().items(Joi.string()).default([]),
});

const createAttempt = {
  body: Joi.object().keys({
    exam: Joi.string().custom(objectId).required(),
    answers: Joi.array().items(answerSchema).default([]),
    writtenAnswers: Joi.array().items(writtenAnswerSchema).default([]),
    chosenOptionalSubjects: Joi.array().items(Joi.string()).default([]),
    student: Joi.string().custom(objectId),
  }),
};

// ✅ Teacher grades written part
const gradeWritten = {
  params: Joi.object().keys({
    attemptId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    grades: Joi.array()
      .items(
        Joi.object().keys({
          question: Joi.string().custom(objectId).required(),
          awardedMarks: Joi.number().min(0).required(),
          feedback: Joi.string().allow('').default(''),
        })
      )
      .required(),
  }),
};

const getAttempt = {
  params: Joi.object().keys({
    attemptId: Joi.string().custom(objectId).required(),
  }),
};

const deleteAttempt = {
  params: Joi.object().keys({
    attemptId: Joi.string().custom(objectId).required(),
  }),
};

const getAttemptsByExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId).required(),
  }),
};

const getAttemptsByStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createAttempt,
  gradeWritten,
  getAttempt,
  deleteAttempt,
  getAttemptsByExam,
  getAttemptsByStudent,
};