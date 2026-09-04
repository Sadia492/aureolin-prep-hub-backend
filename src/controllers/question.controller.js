const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { questionService } = require('../services');

const createQuestion = catchAsync(async (req, res) => {
  const question = await questionService.createQuestion({
    ...req.body,
    createdBy: req.user.id,
  });

  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, question, 'Question created successfully'));
});

const getQuestions = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.subject) {
    filter.subject = req.query.subject;
  }
  const questions = await questionService.queryQuestions(filter);
  res.send(new ApiResponse(httpStatus.OK, questions, 'Questions retrieved successfully'));
});

const getQuestion = catchAsync(async (req, res) => {
  const question = await questionService.getQuestionById(req.params.questionId);

  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  res.send(new ApiResponse(httpStatus.OK, question, 'Question retrieved successfully'));
});

const updateQuestion = catchAsync(async (req, res) => {
  const question = await questionService.updateQuestionById(req.params.questionId, req.body);
  res.send(new ApiResponse(httpStatus.OK, question, 'Question updated successfully'));
});

const deleteQuestion = catchAsync(async (req, res) => {
  await questionService.deleteQuestionById(req.params.questionId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
