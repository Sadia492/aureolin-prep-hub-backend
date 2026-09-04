const { User, Course, Exam, Question, Attempt, QnA } = require('../models');

const getStats = async (user) => {
  let courseFilter = {};
  let examFilter = {};
  let attemptFilter = {};
  let qnaFilter = {};

  if (user.role === 'student') {
    courseFilter = { students: user.id };
    const courses = await Course.find(courseFilter).select('_id');
    const courseIds = courses.map((c) => c._id);
    examFilter = { course: { $in: courseIds } };
    attemptFilter = { student: user.id };
    qnaFilter = { student: user.id };
  }

  if (user.role === 'teacher') {
    courseFilter = { createdBy: user.id };
    const courses = await Course.find(courseFilter).select('_id');
    const courseIds = courses.map((c) => c._id);
    examFilter = { course: { $in: courseIds } };
    const exams = await Exam.find(examFilter).select('_id');
    const examIds = exams.map((e) => e._id);
    attemptFilter = { exam: { $in: examIds } };
    qnaFilter = {};
  }

  const totalCourses = await Course.countDocuments(courseFilter);
  const totalExams = await Exam.countDocuments(examFilter);
  const totalQuestions = await Question.countDocuments();
  const totalAttempts = await Attempt.countDocuments(attemptFilter);
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTeachers = await User.countDocuments({ role: 'teacher' });

  const avgAccuracyAgg = await Attempt.aggregate([
    { $match: attemptFilter },
    { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } },
  ]);
  const avgAccuracy = avgAccuracyAgg.length > 0
    ? parseFloat(avgAccuracyAgg[0].avgAccuracy.toFixed(2))
    : 0;

  const avgScoreAgg = await Attempt.aggregate([
    { $match: attemptFilter },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);
  const avgScore = avgScoreAgg.length > 0
    ? parseFloat(avgScoreAgg[0].avgScore.toFixed(2))
    : 0;

  const pendingQnAs = await QnA.countDocuments({
    ...qnaFilter,
    status: 'pending',
  });
  const answeredQnAs = await QnA.countDocuments({
    ...qnaFilter,
    status: 'answered',
  });

  return {
    totalCourses,
    totalExams,
    totalQuestions,
    totalAttempts,
    totalStudents,
    totalTeachers,
    avgAccuracy,
    avgScore,
    pendingQnAs,
    answeredQnAs,
  };
};

const getMyCourses = async (user) => {
  let filter = {};

  if (user.role === 'student') {
    filter = { students: user.id };
  } else if (user.role === 'teacher') {
    filter = { createdBy: user.id };
  }

  return Course.find(filter)
    .populate('students', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);
};

const getRecentAttempts = async (user) => {
  let filter = {};

  if (user.role === 'student') {
    filter = { student: user.id };
  } else if (user.role === 'teacher') {
    const courses = await Course.find({ createdBy: user.id }).select('_id');
    const exams = await Exam.find({
      course: { $in: courses.map((c) => c._id) },
    }).select('_id');
    filter = { exam: { $in: exams.map((e) => e._id) } };
  }

  return Attempt.find(filter)
    .populate('student', 'name email')
    .populate('exam', 'title subject totalMarks')
    .sort({ submittedAt: -1 })
    .limit(5);
};

module.exports = {
  getStats,
  getMyCourses,
  getRecentAttempts,
};
