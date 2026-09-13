// backend/src/validations/exam.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

// ✅ Section schema
const sectionSchema = Joi.object({
  name: Joi.string().required(),
  isCompulsory: Joi.boolean().default(false),
  order: Joi.number().integer().default(0),
});

// ✅ Question schema
// backend/src/validations/exam.validation.js — inside questionSchema
const questionSchema = Joi.object({
  _id: Joi.string().optional(),
  question: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).default([]),   // ✅
  options: Joi.array().items(Joi.string().allow('')).length(4).required(),
  correctAnswer: Joi.number().integer().min(0).max(3).required(),
  explanation: Joi.string().allow('').default(''),
  subject: Joi.string().required(),
  marks: Joi.number().min(0).default(1),
  order: Joi.number().integer().default(0),
});

const createExam = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    unit: Joi.string().valid('A Unit', 'C Unit').required(),
    course: Joi.string().custom(objectId).allow(null, ''),
    sections: Joi.array().items(sectionSchema).default([]),
    questions: Joi.array().items(questionSchema).default([]),
    duration: Joi.number().integer().min(1).default(45),
    totalMarks: Joi.number().min(0).default(60),
    negativeMark: Joi.number().min(0).default(0.25),
    passMarks: Joi.number().min(0).default(24),
    englishMinMarks: Joi.number().min(0).default(5),
    requiredOptionalCount: Joi.number().integer().min(1).default(1),
    scheduledAt: Joi.date().iso().required(),
    isPublished: Joi.boolean().default(false),
  }),
};

const updateExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      unit: Joi.string().valid('A Unit', 'C Unit'),
      course: Joi.string().custom(objectId).allow(null, ''),
      sections: Joi.array().items(sectionSchema),
      questions: Joi.array().items(questionSchema),
      duration: Joi.number().integer().min(1),
      totalMarks: Joi.number().min(0),
      negativeMark: Joi.number().min(0),
      passMarks: Joi.number().min(0),
      englishMinMarks: Joi.number().min(0),
      requiredOptionalCount: Joi.number().integer().min(1),
      scheduledAt: Joi.date().iso(),
      isPublished: Joi.boolean(),
    })
    .min(1),
};

const getExams = {
  query: Joi.object().keys({
    unit: Joi.string().valid('A Unit', 'C Unit'),
    isPublished: Joi.boolean(),
    search: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
};

const deleteExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
};

const submitExam = {
  params: Joi.object().keys({
    examId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    chosenOptionalSubjects: Joi.array().items(Joi.string()).default([]),
    answers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),   // ✅ subdoc _id, not ObjectId necessarily
          selectedOption: Joi.number().integer().min(0).max(3).allow(null),
        })
      )
      .default([]),
  }),
};

module.exports = {
  createExam,
  updateExam,
  getExams,
  getExam,
  deleteExam,
  submitExam,
};