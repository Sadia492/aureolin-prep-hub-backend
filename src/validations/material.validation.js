// backend/src/validations/material.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createMaterial = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    subject: Joi.string().required(),
    type: Joi.string().valid(
      'Lecture Note', 'Practice Sheet', 'Previous Questions', 'Exam Solution', 'PDF', 'Video'
    ).default('PDF'),
    course: Joi.string().custom(objectId).allow(null, ''),
    targetUnit: Joi.string().allow(null, ''),
    isPublished: Joi.boolean().default(false),
  }),
};

const updateMaterial = {
  params: Joi.object().keys({
    materialId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string(),
    description: Joi.string().allow(''),
    subject: Joi.string(),
    type: Joi.string().valid(
      'Lecture Note', 'Practice Sheet', 'Previous Questions', 'Exam Solution', 'PDF', 'Video'
    ),
    course: Joi.string().custom(objectId).allow(null, ''),
    targetUnit: Joi.string().allow(null, ''),
    isPublished: Joi.boolean(),
  }).min(1),
};

const getMaterials = {
  query: Joi.object().keys({
    subject: Joi.string(),
    type: Joi.string(),
    targetUnit: Joi.string(),
    isPublished: Joi.boolean(),
    search: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPublicMaterials = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(20),
    subject: Joi.string(),
    targetUnit: Joi.string(),
    type: Joi.string(),
  }),
};

const getMaterial = {
  params: Joi.object().keys({
    materialId: Joi.string().custom(objectId),
  }),
};

const deleteMaterial = {
  params: Joi.object().keys({
    materialId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createMaterial,
  updateMaterial,
  getMaterials,
  getPublicMaterials,
  getMaterial,
  deleteMaterial,
};