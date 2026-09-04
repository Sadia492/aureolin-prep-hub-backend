const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { attemptService } = require('../services');

const createAttempt = catchAsync(async (req, res) => {
  const attempt = await attemptService.createAttempt({
    ...req.body,
    student: req.user.role === 'student' ? req.user.id : req.body.student,
    submittedAt: new Date(),
  });

  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, attempt, 'Attempt submitted successfully'));
});

const getAttempts = catchAsync(async (req, res) => {
  const attempts = await attemptService.queryAttempts(req.user);
  res.send(new ApiResponse(httpStatus.OK, attempts, 'Attempts retrieved successfully'));
});

const getAttempt = catchAsync(async (req, res) => {
  const attempt = await attemptService.getAttemptById(req.params.attemptId);

  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  res.send(new ApiResponse(httpStatus.OK, attempt, 'Attempt retrieved successfully'));
});

const getAttemptsByExam = catchAsync(async (req, res) => {
  const attempts = await attemptService.getAttemptsByExam(req.params.examId);
  res.send(new ApiResponse(httpStatus.OK, attempts, 'Attempts for exam retrieved successfully'));
});

const getAttemptsByStudent = catchAsync(async (req, res) => {
  const attempts = await attemptService.getAttemptsByStudent(req.params.studentId);
  res.send(new ApiResponse(httpStatus.OK, attempts, 'Attempts for student retrieved successfully'));
});

const deleteAttempt = catchAsync(async (req, res) => {
  await attemptService.deleteAttemptById(req.params.attemptId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createAttempt,
  getAttempts,
  getAttempt,
  getAttemptsByExam,
  getAttemptsByStudent,
  deleteAttempt,
};
