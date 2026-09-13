const { default: mongoose } = require('mongoose');
const { Attempt, Exam, Course, Question, User, QnA } = require('../models');

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

// backend/src/services/analytics.service.js
const getSubjectWisePerformance = async (user) => {
  let match = {};
  if (user.role === 'student') {
    match = { student: user.id };
  }

  return Attempt.aggregate([
    { $match: match },
    // Unwind answers array so we can group by subject
    { $unwind: '$answers' },
    {
      $group: {
        _id: '$answers.subject',
        totalAttempts: { $sum: 1 },
        totalCorrect: {
          $sum: { $cond: ['$answers.isCorrect', 1, 0] },
        },
        totalWrong: {
          $sum: {
            $cond: [
              { $and: ['$answers.selectedOption', { $eq: ['$answers.isCorrect', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        subject: '$_id',
        totalAttempts: 1,
        totalCorrect: 1,
        totalWrong: 1,
        avgAccuracy: {
          $cond: [
            { $eq: ['$totalAttempts', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$totalCorrect', '$totalAttempts'] },
                100,
              ],
            },
          ],
        },
      },
    },
    { $sort: { avgAccuracy: -1 } },
  ]);
};

// backend/src/services/analytics.service.js
const getExamLeaderboard = async (examId) => {
  const match = examId ? { exam: new mongoose.Types.ObjectId(examId) } : {};

  return Attempt.aggregate([
    { $match: { ...match, status: 'submitted' } },
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
          unit: '$examDoc.unit',       // ✅ changed from 'subject'
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
  return Exam.aggregate([
    { $unwind: '$questions' },
    {
      $group: {
        _id: '$questions.subject',
        totalQuestions: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        subject: '$_id',
        totalQuestions: 1,
      },
    },
    { $sort: { totalQuestions: -1 } },
  ]);
};
// backend/src/services/analytics.service.js — add this function
// backend/src/services/analytics.service.js
const getTeacherStats = async (teacherId) => {
  // 1. Pending QnA count
  const pendingQnA = await QnA.countDocuments({ status: 'pending' });

  // 2. Question bank total (embedded in exams)
  const myQuestions = await Exam.aggregate([
    { $unwind: '$questions' },
    { $count: 'total' },
  ]).then((r) => r[0]?.total ?? 0);

  // 3. Published exams
  const upcomingExams = await Exam.countDocuments({ isPublished: true });

  // 4. Batch students (courses created by this teacher)
  const coursesTaught = await Course.find({ createdBy: teacherId })
    .select('students')
    .lean();
  const batchStudents = coursesTaught.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );

  // 5. QnA activity — group by DAY (date), then map to weekday name in JS
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rawActivity = await QnA.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        asked: { $sum: 1 },
        answered: {
          $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },  // chronological
  ]);

  // ✅ Map YYYY-MM-DD → "Sat", "Sun", etc.
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const qnaActivity = rawActivity.map((row) => {
    const d = new Date(row._id);
    return {
      _id: dayNames[d.getDay()],
      date: row._id,
      asked: row.asked,
      answered: row.answered,
    };
  });

  return {
    pendingQnA,
    myQuestions,
    upcomingExams,
    batchStudents,
    qnaActivity,
  };
};

// backend/src/services/analytics.service.js
const getStudentStats = async (studentId) => {
  const studentObjId = new mongoose.Types.ObjectId(studentId);

  const totalAttempts = await Attempt.countDocuments({
    student: studentObjId,
    status: 'submitted',
  });

  const latestAttempt = await Attempt.findOne({
    student: studentObjId,
    status: 'submitted',
  })
    .sort({ submittedAt: -1 })
    .populate('exam', 'title unit totalMarks')
    .lean();

  const scoreAgg = await Attempt.aggregate([
    { $match: { student: studentObjId, status: 'submitted' } },
    {
      $group: {
        _id: null,
        totalScore: { $sum: '$score' },
        avgAccuracy: { $avg: '$accuracy' },
        totalCorrect: { $sum: '$correct' },
        totalWrong: { $sum: '$wrong' },
        passedCount: { $sum: { $cond: ['$isPassed', 1, 0] } },
      },
    },
  ]);
  const totals = scoreAgg[0] || {
    totalScore: 0,
    avgAccuracy: 0,
    totalCorrect: 0,
    totalWrong: 0,
    passedCount: 0,
  };

  const pendingQnA = await QnA.countDocuments({
    student: studentObjId,
    status: 'pending',
  });

  const totalQnA = await QnA.countDocuments({ student: studentObjId });

  const recentAttempts = await Attempt.find({
    student: studentObjId,
    status: 'submitted',
  })
    .sort({ submittedAt: 1 })
    .limit(10)
    .populate('exam', 'title')
    .select('score accuracy submittedAt exam')
    .lean();

  const subjectWiseRaw = await Attempt.aggregate([
    {
      $match: {
        student: studentObjId,
        status: 'submitted',
        subjectWise: { $exists: true, $ne: [] },
      },
    },
    { $unwind: '$subjectWise' },
    {
      $group: {
        _id: '$subjectWise.subject',
        totalCorrect: { $sum: '$subjectWise.correct' },
        totalWrong: { $sum: '$subjectWise.wrong' },
        totalUnanswered: { $sum: '$subjectWise.unanswered' },
        totalScore: { $sum: '$subjectWise.score' },
        totalMarks: { $sum: '$subjectWise.totalMarks' },
      },
    },
    {
      $project: {
        _id: 0,
        subject: '$_id',
        correct: '$totalCorrect',
        wrong: '$totalWrong',
        unanswered: '$totalUnanswered',
        score: { $round: ['$totalScore', 2] },
        totalMarks: '$totalMarks',
        accuracy: {
          $cond: [
            { $eq: [{ $add: ['$totalCorrect', '$totalWrong'] }, 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$totalCorrect', { $add: ['$totalCorrect', '$totalWrong'] }] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
      },
    },
    { $sort: { accuracy: -1 } },
  ]);

  return {
    totalAttempts,
    totalQnA,
    pendingQnA,
    latestAttempt: latestAttempt
      ? {
          id: latestAttempt._id,
          score: latestAttempt.score,
          accuracy: latestAttempt.accuracy,
          isPassed: latestAttempt.isPassed,
          submittedAt: latestAttempt.submittedAt,
          exam: latestAttempt.exam,
        }
      : null,
    totals: {
      totalScore: Math.round(totals.totalScore * 100) / 100,
      avgAccuracy: Math.round(totals.avgAccuracy * 100) / 100,
      totalCorrect: totals.totalCorrect,
      totalWrong: totals.totalWrong,
      passedCount: totals.passedCount,
    },
    recentAttempts: recentAttempts.map((a, i) => ({
      exam: `#${i + 1}`,
      title: a.exam?.title || 'পরীক্ষা',
      score: a.score,
      accuracy: a.accuracy,
    })),
    subjectWise: subjectWiseRaw.map((s) => ({
      subject: s.subject,
      score: s.score,
      accuracy: s.accuracy,
    })),
  };
};

module.exports = {
  getAttemptAccuracyTrend,
  getSubjectWisePerformance,
  getExamLeaderboard,
  getCourseStats,
  getQuestionBankStats,
  getTeacherStats,
  getStudentStats,
};
