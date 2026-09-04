const httpStatus = require('http-status').default;
const { Attempt, Exam, Question } = require('../models');
const ApiError = require('../utils/ApiError');

const calculateResults = async (exam, answers) => {
  const examDoc = await Exam.findById(exam).populate('questions');
  if (!examDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let score = 0;

  const totalQuestions = examDoc.questions.length;
  const marksPerQuestion = totalQuestions > 0 ? examDoc.totalMarks / totalQuestions : 0;

  const populatedAnswers = answers.map((ans) => {
    const questionDoc = examDoc.questions.find(
      (q) => q._id.toString() === ans.question.toString()
    );

    if (!questionDoc) {
      return { ...ans, isCorrect: false, marks: 0 };
    }

    if (ans.selectedOption === undefined || ans.selectedOption === null) {
      unanswered++;
      return { ...ans, isCorrect: false, marks: 0 };
    }

    const isCorrect = ans.selectedOption === questionDoc.correctAnswer;

    if (isCorrect) {
      correct++;
      score += marksPerQuestion;
      return { ...ans, isCorrect: true, marks: marksPerQuestion };
    } else {
      wrong++;
      score -= examDoc.negativeMark || 0;
      return { ...ans, isCorrect: false, marks: -(examDoc.negativeMark || 0) };
    }
  });

  const answered = correct + wrong;
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

  return {
    answers: populatedAnswers,
    score: Math.max(0, score),
    correct,
    wrong,
    unanswered,
    accuracy: parseFloat(accuracy.toFixed(2)),
  };
};

const createAttempt = async (attemptBody) => {
  const results = await calculateResults(attemptBody.exam, attemptBody.answers || []);

  return Attempt.create({
    ...attemptBody,
    ...results,
    submittedAt: attemptBody.submittedAt || new Date(),
  });
};

const queryAttempts = async (user, filter = {}) => {
  let queryFilter = { ...filter };

  if (user.role === 'student') {
    queryFilter = {
      ...queryFilter,
      student: user.id,
    };
  }

  return Attempt.find(queryFilter)
    .populate('student', 'name email role')
    .populate({
      path: 'exam',
      select: 'title course subject totalMarks duration',
      populate: { path: 'course', select: 'title unit' },
    })
    .populate({
      path: 'answers.question',
      select: 'question options correctAnswer explanation subject',
    })
    .sort({ submittedAt: -1 });
};

const getAttemptById = async (attemptId) => {
  return Attempt.findById(attemptId)
    .populate('student', 'name email role background targetUnit')
    .populate({
      path: 'exam',
      select: 'title course subject questions totalMarks duration negativeMark scheduledAt',
      populate: [
        { path: 'course', select: 'title unit' },
        { path: 'questions', select: 'question options correctAnswer explanation subject' },
      ],
    })
    .populate({
      path: 'answers.question',
      select: 'question options correctAnswer explanation subject',
    });
};

const getAttemptsByExam = async (examId) => {
  return Attempt.find({ exam: examId })
    .populate('student', 'name email role')
    .populate('exam', 'title subject')
    .sort({ score: -1 });
};

const getAttemptsByStudent = async (studentId) => {
  return Attempt.find({ student: studentId })
    .populate({
      path: 'exam',
      select: 'title course subject totalMarks',
      populate: { path: 'course', select: 'title unit' },
    })
    .sort({ submittedAt: -1 });
};

const deleteAttemptById = async (attemptId) => {
  const attempt = await getAttemptById(attemptId);

  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  await attempt.deleteOne();

  return attempt;
};

module.exports = {
  createAttempt,
  queryAttempts,
  getAttemptById,
  getAttemptsByExam,
  getAttemptsByStudent,
  deleteAttemptById,
};
