// backend/src/services/attempt.service.js
const httpStatus = require('http-status').default;
const { Attempt, Exam, Question } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Calculate results for a DU-style exam
 * @param {string} examId
 * @param {Array} answers - [{ question, selectedOption }]
 * @param {Array} chosenOptionalSubjects - ["Physics", "Chemistry"]
 */
const calculateResults = async (examId, answers, chosenOptionalSubjects = []) => {
  const examDoc = await Exam.findById(examId).populate('questions.question');
  if (!examDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  // Validate optional count
  if (chosenOptionalSubjects.length !== examDoc.requiredOptionalCount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You must choose exactly ${examDoc.requiredOptionalCount} optional subjects`
    );
  }

  const invalid = chosenOptionalSubjects.filter(
    (s) => !examDoc.optionalSubjects.includes(s)
  );
  if (invalid.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid optional subjects: ${invalid.join(', ')}`
    );
  }

  let score = 0, correct = 0, wrong = 0, unanswered = 0;
  const subjectWiseMap = {};
  const gradedAnswers = [];

  examDoc.questions.forEach((item) => {
    const q = item.question;
    if (!q) return; // question deleted

    const subject = item.subject;
    const isCompulsory = examDoc.compulsorySubjects.includes(subject);
    const isChosenOptional = chosenOptionalSubjects.includes(subject);

    // Skip optional subjects the student didn't choose
    if (!isCompulsory && !isChosenOptional) return;

    // Init subject-wise bucket
    if (!subjectWiseMap[subject]) {
      subjectWiseMap[subject] = {
        subject,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        score: 0,
        totalMarks: 0,
      };
    }
    subjectWiseMap[subject].totalMarks += q.marks || 1;

    // Find student's answer
    const studentAnswer = answers.find(
      (a) => a.question.toString() === q._id.toString()
    );

    if (
      !studentAnswer ||
      studentAnswer.selectedOption === undefined ||
      studentAnswer.selectedOption === null
    ) {
      unanswered++;
      subjectWiseMap[subject].unanswered++;
      gradedAnswers.push({
        question: q._id,
        subject,
        selectedOption: null,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marks: 0,
      });
      return;
    }

    const isCorrect = studentAnswer.selectedOption === q.correctAnswer;

    if (isCorrect) {
      correct++;
      const m = q.marks || 1;
      score += m;
      subjectWiseMap[subject].correct++;
      subjectWiseMap[subject].score += m;
      gradedAnswers.push({
        question: q._id,
        subject,
        selectedOption: studentAnswer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: true,
        marks: m,
      });
    } else {
      wrong++;
      score -= examDoc.negativeMark;
      subjectWiseMap[subject].wrong++;
      subjectWiseMap[subject].score -= examDoc.negativeMark;
      gradedAnswers.push({
        question: q._id,
        subject,
        selectedOption: studentAnswer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marks: -examDoc.negativeMark,
      });
    }
  });

  score = Math.max(0, score);
  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  const passedOverall = score >= examDoc.passMarks;
  const englishScore = subjectWiseMap['English']?.score || 0;
  const passedEnglish = englishScore >= examDoc.englishMinMarks;
  const isPassed = passedOverall && passedEnglish;

  return {
    answers: gradedAnswers,
    score: Math.round(score * 100) / 100,
    correct,
    wrong,
    unanswered,
    accuracy: Math.round(accuracy * 100) / 100,
    subjectWise: Object.values(subjectWiseMap),
    isPassed,
    passedOverall,
    passedEnglish,
  };
};

// ============ Create Attempt (Submit Exam) ============

const createAttempt = async (attemptBody) => {
  const { exam, answers = [], chosenOptionalSubjects = [], student } = attemptBody;

  // Prevent duplicate submission
  const existing = await Attempt.findOne({ student, exam });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already attempted this exam');
  }

  const results = await calculateResults(exam, answers, chosenOptionalSubjects);

  return Attempt.create({
    student,
    exam,
    chosenOptionalSubjects,
    ...results,
    submittedAt: new Date(),
  });
};

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
  return Attempt.findById(attemptId)
    .populate('student', 'name email role background targetUnit')
    .populate({
      path: 'exam',
      select: 'title unit totalMarks passMarks englishMinMarks negativeMark scheduledAt',
    })
    .populate({
      path: 'answers.question',
      select: 'question options correctAnswer explanation subject marks',
    });
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
  createAttempt,
  queryAttempts,
  getAttemptById,
  getAttemptsByExam,
  getAttemptsByStudent,
  deleteAttemptById,
};