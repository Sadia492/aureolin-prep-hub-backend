const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status').default;
const ApiResponse = require('../utils/ApiResponse');
const analyticsService = require('../services/analytics.service');

const getAttemptAccuracyTrend = catchAsync(async (req, res) => {
  const data = await analyticsService.getAttemptAccuracyTrend(req.user);
  res.send(new ApiResponse(httpStatus.OK, data, 'Attempt accuracy trend'));
});

const getSubjectWisePerformance = catchAsync(async (req, res) => {
  const data = await analyticsService.getSubjectWisePerformance(req.user);
  res.send(new ApiResponse(httpStatus.OK, data, 'Subject-wise performance'));
});

const getExamLeaderboard = catchAsync(async (req, res) => {
  const data = await analyticsService.getExamLeaderboard(req.params.examId);
  res.send(new ApiResponse(httpStatus.OK, data, 'Exam leaderboard'));
});

const getCourseStats = catchAsync(async (req, res) => {
  const data = await analyticsService.getCourseStats();
  res.send(new ApiResponse(httpStatus.OK, data, 'Course stats'));
});

const getQuestionBankStats = catchAsync(async (req, res) => {
  const data = await analyticsService.getQuestionBankStats();
  res.send(new ApiResponse(httpStatus.OK, data, 'Question bank stats'));
});

module.exports = {
  getAttemptAccuracyTrend,
  getSubjectWisePerformance,
  getExamLeaderboard,
  getCourseStats,
  getQuestionBankStats,
};
