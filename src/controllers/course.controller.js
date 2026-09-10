// backend/src/controllers/course.controller.js
const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { courseService } = require('../services');

const createCourse = catchAsync(async (req, res) => {
  const course = await courseService.createCourse({
    ...req.body,
    createdBy: req.user.id,
  });

  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, course, 'Course created successfully'));
});

const getCourses = catchAsync(async (req, res) => {
  // ✅ Pass filter, options, and user separately
  const filter = {};
  const options = {};
  const courses = await courseService.queryCourses(filter, options, req.user);
  res.send(new ApiResponse(httpStatus.OK, courses, 'Courses retrieved successfully'));
});

const getCourse = catchAsync(async (req, res) => {
  const course = await courseService.getCourseById(req.params.courseId);

  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  res.send(new ApiResponse(httpStatus.OK, course, 'Course retrieved successfully'));
});

const updateCourse = catchAsync(async (req, res) => {
  const course = await courseService.updateCourseById(req.params.courseId, req.body);
  res.send(new ApiResponse(httpStatus.OK, course, 'Course updated successfully'));
});

const deleteCourse = catchAsync(async (req, res) => {
  await courseService.deleteCourseById(req.params.courseId);
  res.status(httpStatus.NO_CONTENT).send();
});

const enrollStudent = catchAsync(async (req, res) => {
  const course = await courseService.enrollStudent(
    req.params.courseId,
    req.body.userId || req.user.id
  );

  res.send(new ApiResponse(httpStatus.OK, course, 'Student enrolled successfully'));
});

const unenrollStudent = catchAsync(async (req, res) => {
  const course = await courseService.unenrollStudent(
    req.params.courseId,
    req.params.userId
  );

  res.send(new ApiResponse(httpStatus.OK, course, 'Student unenrolled successfully'));
});

// ✅ Fixed: Public courses controller
const getPublicCourses = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const unit = req.query.unit;
  
  const filter = {};
  if (unit) filter.unit = unit;

  const options = {
    limit,
    sortBy: 'createdAt:desc',
  };

  // ✅ Pass filter and options correctly (no user)
  const result = await courseService.queryCourses(filter, options, null);
  
  // ✅ Handle both paginated and non-paginated results
  const courses = result?.docs || result || [];
  
  res.send(new ApiResponse(
    httpStatus.OK,
    { docs: courses, totalDocs: courses.length },
    'Courses retrieved successfully'
  ));
});

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
  getPublicCourses,
};