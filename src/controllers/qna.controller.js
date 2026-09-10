// backend/src/controllers/qna.controller.js
const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { qnaService } = require('../services');

const createQnA = catchAsync(async (req, res) => {
  const qna = await qnaService.createQnA({
    ...req.body,
    student: req.user.role === 'student' ? req.user.id : req.body.student,
  });

  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, qna, 'QnA created successfully'));
});

const getQnAs = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.subject) {
    filter.subject = req.query.subject;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const qnas = await qnaService.queryQnAs(req.user, filter);
  res.send(new ApiResponse(httpStatus.OK, qnas, 'QnAs retrieved successfully'));
});

const getQnA = catchAsync(async (req, res) => {
  const qna = await qnaService.getQnAById(req.params.qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
  }

  res.send(new ApiResponse(httpStatus.OK, qna, 'QnA retrieved successfully'));
});

const answerQnA = catchAsync(async (req, res) => {
  // ✅ Fix: Ensure answerImages is passed correctly
  const qna = await qnaService.answerQnA(req.params.qnaId, {
    answer: req.body.answer,
    answerImages: req.body.answerImages || [], // ✅ Pass answerImages
    answeredBy: req.user.id,
  });

  res.send(new ApiResponse(httpStatus.OK, qna, 'QnA answered successfully'));
});

const updateQnA = catchAsync(async (req, res) => {
  // ✅ Fix: Pass userId and role to service
  const qna = await qnaService.updateQnAById(
    req.params.qnaId, 
    req.body,
    req.user.id,
    req.user.role
  );
  res.send(new ApiResponse(httpStatus.OK, qna, 'QnA updated successfully'));
});

const deleteQnA = catchAsync(async (req, res) => {
  // ✅ Fix: Pass userId and role to service
  await qnaService.deleteQnAById(
    req.params.qnaId,
    req.user.id,
    req.user.role
  );
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createQnA,
  getQnAs,
  getQnA,
  answerQnA,
  updateQnA,
  deleteQnA,
};