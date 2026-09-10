// backend/src/services/course.service.js
const httpStatus = require('http-status').default;
const { Course, User } = require('../models');
const ApiError = require('../utils/ApiError');

const createCourse = async (courseBody) => {
  return Course.create(courseBody);
};

// ✅ Fixed: Make user optional and handle both scenarios
const queryCourses = async (filter = {}, options = {}, user = null) => {
  let queryFilter = { ...filter };

  // If user is provided and is a student, filter by enrolled courses
  if (user && user.role === 'student') {
    queryFilter = {
      ...queryFilter,
      students: user.id,
    };
  }

  // If no options provided, use find()
  if (!options.limit && !options.page) {
    return Course.find(queryFilter)
      .populate('createdBy', 'name email role')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
  }

  // Otherwise use paginate
  const result = await Course.paginate(queryFilter, {
    ...options,
    populate: [
      { path: 'createdBy', select: 'name email role' },
      { path: 'students', select: 'name email' },
    ],
    sort: options.sortBy ? { [options.sortBy.split(':')[0]]: options.sortBy.split(':')[1] === 'desc' ? -1 : 1 } : { createdAt: -1 },
  });

  return result;
};

const getCourseById = async (courseId) => {
  return Course.findById(courseId)
    .populate('createdBy', 'name email role')
    .populate('students', 'name email');
};

const updateCourseById = async (courseId, updateBody) => {
  const course = await getCourseById(courseId);

  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  Object.assign(course, updateBody);
  await course.save();

  return course;
};

const deleteCourseById = async (courseId) => {
  const course = await getCourseById(courseId);

  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  await course.deleteOne();

  return course;
};

const enrollStudent = async (courseId, userId) => {
  const course = await getCourseById(courseId);

  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const alreadyEnrolled = course.students.some(
    (student) => student._id.toString() === userId
  );

  if (alreadyEnrolled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student already enrolled in course');
  }

  course.students.push(userId);
  await course.save();

  return course;
};

const unenrollStudent = async (courseId, userId) => {
  const course = await getCourseById(courseId);

  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  course.students = course.students.filter(
    (student) => student._id.toString() !== userId
  );

  await course.save();

  return course;
};

module.exports = {
  createCourse,
  queryCourses,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  enrollStudent,
  unenrollStudent,
};