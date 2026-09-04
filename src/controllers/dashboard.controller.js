const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('http-status').default;
const dashboardService = require('../services/dashboard.service');

const getStats = catchAsync(async (req, res) => {
  const data = await dashboardService.getStats(req.user);
  res.send(new ApiResponse(httpStatus.OK, data, 'Dashboard stats'));
});

const getMyCourses = catchAsync(async (req, res) => {
  const data = await dashboardService.getMyCourses(req.user);
  res.send(new ApiResponse(httpStatus.OK, data, 'My courses'));
});

const getRecentAttempts = catchAsync(async (req, res) => {
  const data = await dashboardService.getRecentAttempts(req.user);
  res.send(new ApiResponse(httpStatus.OK, data, 'Recent attempts'));
});

module.exports = {
  getStats,
  getMyCourses,
  getRecentAttempts,
};
