// backend/src/controllers/exam.controller.js
const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { examService } = require('../services');

const createExam = catchAsync(async (req, res) => {
  const exam = await examService.createExam({
    ...req.body,
    createdBy: req.user.id,
  });
  res.status(httpStatus.CREATED).send(
    new ApiResponse(httpStatus.CREATED, exam, 'Exam created successfully')
  );
});

const getExams = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.unit) filter.unit = req.query.unit;
  if (req.query.isPublished !== undefined) {
    filter.isPublished = req.query.isPublished === 'true';
  }
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  const options = {
    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
  };

  const exams = await examService.queryExams(req.user, filter, options);
  res.send(new ApiResponse(httpStatus.OK, exams, 'Exams retrieved successfully'));
});

const getExam = catchAsync(async (req, res) => {
  const exam = await examService.getExamById(req.params.examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  res.send(new ApiResponse(httpStatus.OK, exam, 'Exam retrieved successfully'));
});

const updateExam = catchAsync(async (req, res) => {
  const exam = await examService.updateExamById(req.params.examId, req.body);
  res.send(new ApiResponse(httpStatus.OK, exam, 'Exam updated successfully'));
});

const deleteExam = catchAsync(async (req, res) => {
  await examService.deleteExamById(req.params.examId);
  res.status(httpStatus.NO_CONTENT).send();
});

const startExam = catchAsync(async (req, res) => {
  const data = await examService.startExam(req.params.examId, req.user.id);
  res.send(new ApiResponse(httpStatus.OK, data, 'Exam started'));
});

const submitExam = catchAsync(async (req, res) => {
  const attempt = await examService.submitExam(
    req.params.examId,
    req.user.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(
    new ApiResponse(httpStatus.CREATED, attempt, 'Exam submitted successfully')
  );
});

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
  startExam,
  submitExam,
};