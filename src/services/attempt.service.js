// backend/src/services/attempt.service.js
const httpStatus = require('http-status').default;
const { Attempt, Exam } = require('../models');
const ApiError = require('../utils/ApiError');

// ============ Queries ============

const queryAttempts = async (user, filter = {}) => {
  let queryFilter = { ...filter };

  if (user.role === 'student') {
    queryFilter.student = user.id;
  }

  return Attempt.find(queryFilter)
    .populate('student', 'name email role')
    .populate({
      path: 'exam',
      select:
        'title unit totalMarks passMarks duration scheduledAt hasWrittenPart writtenTotalMarks writtenPassMarks writtenSeparatePass',
    })
    .sort({ submittedAt: -1 });
};

const getAttemptById = async (attemptId) => {
  const attempt = await Attempt.findById(attemptId)
    .populate('student', 'name email role background targetUnit')
    .populate({
      path: 'exam',
      select:
        'title unit totalMarks passMarks englishMinMarks negativeMark scheduledAt sections questions hasWrittenPart writtenPassMarks writtenSeparatePass writtenTotalMarks',
    });

  if (!attempt) return null;
  if (!attempt.exam || !attempt.exam.questions) return attempt;

  // Manually enrich MCQ answers with question text/options/explanation
  const exam = attempt.exam;
  const enriched = attempt.answers.map((a) => {
    const qid = a.question.toString();
    const question = exam.questions.find((q) => q._id.toString() === qid);

    const obj = a.toObject();

    return {
      ...obj,
      questionText: obj.questionText || question?.question || '',
      questionOptions:
        obj.questionOptions?.length > 0
          ? obj.questionOptions
          : question?.options || [],
      questionExplanation:
        obj.questionExplanation || question?.explanation || '',
      questionImages:
        obj.questionImages?.length > 0
          ? obj.questionImages
          : question?.images || [],
    };
  });

  attempt.answers = enriched;
  return attempt;
};

const getAttemptsByExam = async (examId) => {
  return Attempt.find({ exam: examId })
    .populate('student', 'name email role')
    .populate('exam', 'title unit')
    .sort({ score: -1 });
};

const getAttemptsByStudent = async (studentId) => {
  return Attempt.find({ student: studentId })
    .populate({
      path: 'exam',
      select: 'title unit totalMarks',
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

// ============ ✅ Teacher: Grade written part (manual marks) ============

const gradeWrittenAttempt = async (attemptId, grades, user) => {
  const attempt = await Attempt.findById(attemptId).populate('exam');
  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  const exam = attempt.exam;
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }
  if (!exam.hasWrittenPart) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This exam has no written part');
  }
  if (attempt.status !== 'submitted') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attempt is not submitted');
  }

  let awardedTotal = 0;

  attempt.writtenAnswers = attempt.writtenAnswers.map((wa) => {
    const g = grades.find((x) => String(x.question) === String(wa.question));
    if (!g) return wa;

    const clamped = Math.max(
      0,
      Math.min(wa.maxMarks, Number(g.awardedMarks) || 0)
    );
    awardedTotal += clamped;

    return {
      ...wa.toObject(),
      awardedMarks: clamped,
      feedback: g.feedback || '',
      graded: true,
      gradedBy: user.id,
      gradedAt: new Date(),
    };
  });

  attempt.writtenAwardedMarks = Math.round(awardedTotal * 100) / 100;
  attempt.writtenGraded = attempt.writtenAnswers.every((w) => w.graded);

  const writtenPassed =
    attempt.writtenAwardedMarks >= (exam.writtenPassMarks || 0);
  attempt.writtenPassed = writtenPassed;

  // Recompute final pass
  const mcqPassed = attempt.passedOverall && attempt.passedEnglish;
  attempt.isPassed = exam.writtenSeparatePass
    ? mcqPassed && writtenPassed
    : mcqPassed;

  await attempt.save();

  return Attempt.findById(attemptId)
    .populate('student', 'name email role')
    .populate(
      'exam',
      'title unit hasWrittenPart writtenPassMarks writtenSeparatePass'
    );
};

module.exports = {
  queryAttempts,
  getAttemptById,
  getAttemptsByExam,
  getAttemptsByStudent,
  deleteAttemptById,
  gradeWrittenAttempt,
};