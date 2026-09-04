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

module.exports = {
  createCourse,
  updateCourse,
  enrollStudent,
  unenrollStudent,
};
