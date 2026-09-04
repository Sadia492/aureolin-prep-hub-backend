const httpStatus = require('http-status').default;
const { QnA, User } = require('../models');
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
    .populate('student', 'name email role')
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

  qna.answer = answerBody.answer;
  qna.answeredBy = answerBody.answeredBy;
  qna.status = 'answered';

  await qna.save();

  return qna;
};

const updateQnAById = async (qnaId, updateBody) => {
  const qna = await getQnAById(qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
  }

  Object.assign(qna, updateBody);
  await qna.save();

  return qna;
};

const deleteQnAById = async (qnaId) => {
  const qna = await getQnAById(qnaId);

  if (!qna) {
    throw new ApiError(httpStatus.NOT_FOUND, 'QnA not found');
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
