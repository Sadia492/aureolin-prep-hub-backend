// backend/src/validations/qna.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createQnA = {
  body: Joi.object().keys({
    subject: Joi.string().required(),
    question: Joi.string().required(),
    images: Joi.array().items(Joi.string().uri()).optional(),
  }),
};

const answerQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    answer: Joi.string().required(),
    answerImages: Joi.array().items(Joi.string().uri()).optional(),
  }),
};

const updateQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string().optional(),
      subject: Joi.string().optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      answer: Joi.string().optional(),
      answerImages: Joi.array().items(Joi.string().uri()).optional(),
      status: Joi.string().valid('pending', 'answered').optional(),
    })
    .min(1),
};

const getQnAs = {
  query: Joi.object().keys({
    subject: Joi.string().optional(),
    status: Joi.string().valid('pending', 'answered').optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
};

const deleteQnA = {
  params: Joi.object().keys({
    qnaId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createQnA,
  answerQnA,
  updateQnA,
  getQnAs,
  getQnA,
  deleteQnA,
};