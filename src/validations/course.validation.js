// backend/src/validations/course.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCourse = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    unit: Joi.string().required(),
    price: Joi.number().min(0).required(),
    students: Joi.array().items(Joi.string().custom(objectId)),
  }),
};

const updateCourse = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      unit: Joi.string(),
      price: Joi.number().min(0),
      students: Joi.array().items(Joi.string().custom(objectId)),
    })
    .min(1),
};

const enrollStudent = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const unenrollStudent = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
  }),
};

// ✅ Public courses validation
const getPublicCourses = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(3),
    unit: Joi.string().optional(),
  }),
};

const getCourse = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId),
  }),
};

const getCourses = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

module.exports = {
  createCourse,
  updateCourse,
  enrollStudent,
  unenrollStudent,
  getPublicCourses,
  getCourse,
  getCourses,
};