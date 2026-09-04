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

  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, exam, 'Exam created successfully'));
});

const getExams = catchAsync(async (req, res) => {
  const exams = await examService.queryExams(req.user);
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

const addQuestion = catchAsync(async (req, res) => {
  const exam = await examService.addQuestionToExam(
    req.params.examId,
    req.body.questionId
  );

  res.send(new ApiResponse(httpStatus.OK, exam, 'Question added to exam successfully'));
});

const removeQuestion = catchAsync(async (req, res) => {
  const exam = await examService.removeQuestionFromExam(
    req.params.examId,
    req.params.questionId
  );

  res.send(new ApiResponse(httpStatus.OK, exam, 'Question removed from exam successfully'));
});

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
  addQuestion,
  removeQuestion,
};
