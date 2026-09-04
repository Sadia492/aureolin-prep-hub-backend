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
  const qna = await qnaService.answerQnA(req.params.qnaId, {
    ...req.body,
    answeredBy: req.user.id,
  });

  res.send(new ApiResponse(httpStatus.OK, qna, 'QnA answered successfully'));
});

const updateQnA = catchAsync(async (req, res) => {
  const qna = await qnaService.updateQnAById(req.params.qnaId, req.body);
  res.send(new ApiResponse(httpStatus.OK, qna, 'QnA updated successfully'));
});

const deleteQnA = catchAsync(async (req, res) => {
  await qnaService.deleteQnAById(req.params.qnaId);
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
