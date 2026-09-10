// backend/src/services/qna.service.js
const httpStatus = require('http-status').default;
const { QnA } = require('../models');
const ApiError = require('../utils/ApiError');

const createQnA = async (qnaBody) => {
  return QnA.create(qnaBody);
};

const queryQnAs = async (user, filter = {}) => {
  let queryFilter = { ...filter };

  if (user.role === 'student') {
    queryFilter = {
      ...queryFilter,
      student: user.id,
    };
  }

  return QnA.find(queryFilter)
    .populate('student', 'name email role background targetUnit')
    .populate('answeredBy', 'name email role')
    .sort({ createdAt: -1 });
};

const getQnAById = async (qnaId) => {
  return QnA.findById(qnaId)
    .populate('student', 'name email role background targetUnit')
    .populate('answeredBy', 'name email role');
};

const answerQnA = async (qnaId, answerBody) => {
  const qna = await getQnAById(qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
  }

  if (qna.status === 'answered') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This question already has an answer');
  }

  qna.answer = answerBody.answer;
  qna.answerImages = answerBody.answerImages || [];
  qna.answeredBy = answerBody.answeredBy;
  qna.status = 'answered';

  await qna.save();

  return qna;
};

const updateQnAById = async (qnaId, updateBody, userId, userRole) => {
  const qna = await getQnAById(qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
  }

  // Authorization checks
  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';

  const isUpdatingQuestion = updateBody.question !== undefined || updateBody.images !== undefined;
  const isUpdatingAnswer = updateBody.answer !== undefined || updateBody.answerImages !== undefined;

  // Students can only update their own questions (not answers)
  if (isStudent) {
    if (isUpdatingAnswer) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Students cannot update answers');
    }
    if (qna.student._id.toString() !== userId.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only edit your own questions');
    }
    if (qna.status === 'answered') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot edit answered questions');
    }
  }

  // Teachers can only update their own answers (not questions)
  if (isTeacher) {
    if (isUpdatingQuestion) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Teachers cannot edit questions');
    }
    if (isUpdatingAnswer) {
      if (!qna.answeredBy || qna.answeredBy._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only edit your own answers');
      }
      if (qna.status !== 'answered') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot edit answer that has not been published');
      }
    }
  }

  // Build allowed updates
  const allowedUpdates = {};
  
  if (isUpdatingQuestion) {
    if (updateBody.question !== undefined) allowedUpdates.question = updateBody.question;
    if (updateBody.images !== undefined) allowedUpdates.images = updateBody.images;
    if (updateBody.subject !== undefined) allowedUpdates.subject = updateBody.subject;
  }
  
  if (isUpdatingAnswer && (isAdmin || (isTeacher && qna.answeredBy && qna.answeredBy._id.toString() === userId.toString()))) {
    if (updateBody.answer !== undefined) allowedUpdates.answer = updateBody.answer;
    if (updateBody.answerImages !== undefined) allowedUpdates.answerImages = updateBody.answerImages; // ✅ Fix: Add answerImages
  }

  if (updateBody.status && isAdmin) {
    allowedUpdates.status = updateBody.status;
  }

  Object.assign(qna, allowedUpdates);
  await qna.save();

  return qna;
};

const deleteQnAById = async (qnaId, userId, userRole) => {
  const qna = await getQnAById(qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
  }

  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';

  if (isStudent) {
    if (qna.student._id.toString() !== userId.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own questions');
    }
    if (qna.status === 'answered') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Cannot delete a question that has been answered');
    }
  }

  if (isTeacher) {
    if (qna.answeredBy && qna.answeredBy._id.toString() === userId.toString()) {
      qna.answer = undefined;
      qna.answerImages = []; // ✅ Fix: Clear answer images
      qna.answeredBy = undefined;
      qna.status = 'pending';
      await qna.save();
      return qna;
    }
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own answers');
  }

  await qna.deleteOne();
  return qna;
};

module.exports = {
  createQnA,
  queryQnAs,
  getQnAById,
  answerQnA,
  updateQnAById,
  deleteQnAById,
};