const httpStatus = require('http-status').default;
const { Exam, Course } = require('../models');
const ApiError = require('../utils/ApiError');

const createExam = async (examBody) => {
  const course = await Course.findById(examBody.course);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }
  return Exam.create(examBody);
};

const queryExams = async (user, filter = {}) => {
  let queryFilter = { ...filter };

  if (user.role === 'student') {
    const courses = await Course.find({ students: user.id });
    const courseIds = courses.map((c) => c._id);
    queryFilter = {
      ...queryFilter,
      course: { $in: courseIds },
    };
  }

  return Exam.find(queryFilter)
    .populate('course', 'title unit')
    .populate('questions', 'question subject')
    .populate('createdBy', 'name email role');
};

const getExamById = async (examId) => {
  return Exam.findById(examId)
    .populate('course', 'title unit')
    .populate('questions', 'question options correctAnswer explanation subject')
    .populate('createdBy', 'name email role');
};

const updateExamById = async (examId, updateBody) => {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (updateBody.course) {
    const course = await Course.findById(updateBody.course);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    }
  }

  Object.assign(exam, updateBody);
  await exam.save();

  return exam;
};

const deleteExamById = async (examId) => {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  await exam.deleteOne();

  return exam;
};

const addQuestionToExam = async (examId, questionId) => {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  const alreadyAdded = exam.questions.some(
    (q) => q._id.toString() === questionId
  );

  if (alreadyAdded) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Question already in exam');
  }

  exam.questions.push(questionId);
  await exam.save();

  return exam;
};

const removeQuestionFromExam = async (examId, questionId) => {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  exam.questions = exam.questions.filter(
    (q) => q._id.toString() !== questionId
  );

  await exam.save();

  return exam;
};

module.exports = {
  createExam,
  queryExams,
  getExamById,
  updateExamById,
  deleteExamById,
  addQuestionToExam,
  removeQuestionFromExam,
};
