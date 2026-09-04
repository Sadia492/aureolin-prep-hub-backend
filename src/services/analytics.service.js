const { Attempt, Exam, Course, Question, User } = require('../models');

const getAttemptAccuracyTrend = async (user) => {
  let match = {};

  if (user.role === 'student') {
    match = { student: user.id };
  }

  return Attempt.aggregate([
    { $match: match },
    { $sort: { submittedAt: 1 } },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
        accuracy: 1,
        score: 1,
      },
    },
    {
      $group: {
        _id: '$date',
        avgAccuracy: { $avg: '$accuracy' },
        avgScore: { $avg: '$score' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);
};

const getSubjectWisePerformance = async (user) => {
  let match = {};

  if (user.role === 'student') {
    match = { student: user.id };
  }

  return Attempt.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examDoc',
      },
    },
    { $unwind: '$examDoc' },
    {
      $group: {
        _id: '$examDoc.subject',
        totalAttempts: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
        avgScore: { $avg: '$score' },
        totalCorrect: { $sum: '$correct' },
        totalWrong: { $sum: '$wrong' },
      },
    },
    {
      $project: {
        subject: '$_id',
        _id: 0,
        totalAttempts: 1,
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        avgScore: { $round: ['$avgScore', 2] },
        totalCorrect: 1,
        totalWrong: 1,
      },
    },
  ]);
};

const getExamLeaderboard = async (examId) => {
  const match = examId ? { exam: examId } : {};

  return Attempt.aggregate([
    { $match: match },
    { $sort: { score: -1, accuracy: -1, submittedAt: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'studentDoc',
      },
    },
    { $unwind: '$studentDoc' },
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examDoc',
      },
    },
    { $unwind: '$examDoc' },
    {
      $project: {
        student: {
          _id: '$studentDoc._id',
          name: '$studentDoc.name',
          email: '$studentDoc.email',
        },
        exam: {
          _id: '$examDoc._id',
          title: '$examDoc.title',
          subject: '$examDoc.subject',
          totalMarks: '$examDoc.totalMarks',
        },
        score: 1,
        accuracy: 1,
        correct: 1,
        wrong: 1,
        unanswered: 1,
        submittedAt: 1,
      },
    },
    { $limit: 20 },
  ]);
};

const getCourseStats = async () => {
  return Course.aggregate([
    {
      $lookup: {
        from: 'exams',
        localField: '_id',
        foreignField: 'course',
        as: 'exams',
      },
    },
    {
      $project: {
        title: 1,
        unit: 1,
        price: 1,
        studentCount: { $size: '$students' },
        examCount: { $size: '$exams' },
      },
    },
    { $sort: { studentCount: -1 } },
    { $limit: 10 },
  ]);
};

const getQuestionBankStats = async () => {
  return Question.aggregate([
    {
      $group: {
        _id: '$subject',
        totalQuestions: { $sum: 1 },
      },
    },
    {
      $project: {
        subject: '$_id',
        _id: 0,
        totalQuestions: 1,
      },
    },
    { $sort: { totalQuestions: -1 } },
  ]);
};

module.exports = {
  getAttemptAccuracyTrend,
  getSubjectWisePerformance,
  getExamLeaderboard,
  getCourseStats,
  getQuestionBankStats,
};
