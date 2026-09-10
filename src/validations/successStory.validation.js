// backend/src/validations/successStory.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createSuccessStory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    university: Joi.string().required(),
    department: Joi.string().required(),
    session: Joi.string().required(),
    background: Joi.string()
      .valid('Science', 'Business Studies', 'Humanities')
      .required(),
    testimonial: Joi.string().required(),
    avatar: Joi.string().uri().optional(),
    isPublished: Joi.boolean().default(false),
  }),
};

const updateSuccessStory = {
  params: Joi.object().keys({
    storyId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      university: Joi.string(),
      department: Joi.string(),
      session: Joi.string(),
      background: Joi.string().valid('Science', 'Business Studies', 'Humanities'),
      testimonial: Joi.string(),
      avatar: Joi.string().uri(),
      isPublished: Joi.boolean(),
    })
    .min(1),
};

const getSuccessStory = {
  params: Joi.object().keys({
    storyId: Joi.string().custom(objectId),
  }),
};

const getSuccessStories = {
  query: Joi.object().keys({
    name: Joi.string(),
    background: Joi.string(),
    session: Joi.string(),
    isPublished: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPublicSuccessStories = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(12),
    background: Joi.string().optional(),
  }),
};

const deleteSuccessStory = {
  params: Joi.object().keys({
    storyId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createSuccessStory,
  updateSuccessStory,
  getSuccessStory,
  getSuccessStories,
  getPublicSuccessStories,
  deleteSuccessStory,
};