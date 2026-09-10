// backend/src/services/question.service.js
const httpStatus = require('http-status').default;
const { Question } = require('../models');
const ApiError = require('../utils/ApiError');

const createQuestion = async (questionBody) => {
  return Question.create(questionBody);
};

const queryQuestions = async (filter = {}, options = {}) => {
  const query = Question.find(filter)
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  if (options.limit) query.limit(options.limit);
  if (options.skip) query.skip(options.skip);

  return query;
};

const getQuestionById = async (questionId) => {
  return Question.findById(questionId)
    .populate('createdBy', 'name email role');
};

const updateQuestionById = async (questionId, updateBody) => {
  const question = await getQuestionById(questionId);

  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  Object.assign(question, updateBody);
  await question.save();

  return question;
};

const deleteQuestionById = async (questionId) => {
  const question = await getQuestionById(questionId);

  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  await question.deleteOne();
  return question;
};

module.exports = {
  createQuestion,
  queryQuestions,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
};