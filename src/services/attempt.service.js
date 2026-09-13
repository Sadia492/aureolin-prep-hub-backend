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
      select: 'title unit totalMarks passMarks duration scheduledAt',
    })
    .sort({ submittedAt: -1 });
};

const getAttemptById = async (attemptId) => {
  console.log('=== getAttemptById CALLED ===', attemptId);

  const attempt = await Attempt.findById(attemptId)
    .populate('student', 'name email role background targetUnit')
    .populate({
      path: 'exam',
      select: 'title unit totalMarks passMarks englishMinMarks negativeMark scheduledAt sections questions',
    });

  if (!attempt) {
    console.log('=== attempt NOT FOUND ===');
    return null;
  }

  console.log('=== attempt found, exam? ===', !!attempt.exam);
  console.log('=== exam.questions length ===', attempt.exam?.questions?.length);

  if (!attempt.exam || !attempt.exam.questions) {
    console.log('=== returning early - no exam.questions ===');
    return attempt;
  }

  // Manually enrich
  const exam = attempt.exam;
  const enriched = attempt.answers.map((a) => {
    const qid = a.question.toString();
    const question = exam.questions.find(
      (q) => q._id.toString() === qid
    );

    console.log('Enriching answer:', {
      qid,
      questionFound: !!question,
      explanation: question?.explanation?.substring(0, 30),
      optionsCount: question?.options?.length,
    });

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

  console.log('=== enriched answers[0] ===', JSON.stringify(enriched[0], null, 2));

  // Replace in the document
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

module.exports = {
  queryAttempts,
  getAttemptById,
  getAttemptsByExam,
  getAttemptsByStudent,
  deleteAttemptById,
};