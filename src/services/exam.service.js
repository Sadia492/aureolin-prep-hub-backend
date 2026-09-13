// backend/src/services/exam.service.js
const httpStatus = require('http-status').default;
const { Exam, Course, Attempt } = require('../models');
const ApiError = require('../utils/ApiError');
const { getExamDeadline, getAttemptDeadline, getEffectiveDeadline } = require('../config/examHelpers');

// ============ CRUD ============

const createExam = async (examBody) => {
  if (examBody.course) {
    const course = await Course.findById(examBody.course);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    }
  }
  return Exam.create(examBody);
};

const queryExams = async (user, filter = {}, options = {}) => {
  let queryFilter = { ...filter };

  if (user.role === 'student') {
    const courses = await Course.find({ students: user.id });
    const courseIds = courses.map((c) => c._id);

    queryFilter = {
      ...queryFilter,
      isPublished: true,
      $or: [
        { course: { $in: courseIds } },
        { course: null },
      ],
    };
  }

  const query = Exam.find(queryFilter)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role')
    .sort({ scheduledAt: -1 });

  if (options.limit) query.limit(options.limit);

 const exams = await query;

// Auto-close exams past deadline
const now = new Date();
await Promise.all(
  exams.map(async (e) => {
    if (e.isPublished && now > getExamDeadline(e)) {
      e.isPublished = false;
      await e.save();
    }
  })
);

return exams;
};

const getExamById = async (examId) => {
  return Exam.findById(examId)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role');
};

const updateExamById = async (examId, updateBody) => {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (updateBody.course) {
    const course = await Course.findById(updateBody.course);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    }
  }

  // ✅ Auto-assign order to sections if not set
  if (updateBody.sections) {
    updateBody.sections = updateBody.sections.map((s, i) => ({
      ...s,
      order: s.order ?? i,
    }));
  }

  // ✅ Auto-assign order to questions if not set
  if (updateBody.questions) {
    updateBody.questions = updateBody.questions.map((q, i) => ({
      ...q,
      order: q.order ?? i,
    }));
  }

  Object.assign(exam, updateBody);
  await exam.save();

  return Exam.findById(examId)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role');
};

const deleteExamById = async (examId) => {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  await exam.deleteOne();
  return exam;
};

// ============ ✅ Student: Start Exam ============

// Replace startExam function with:
const startExam = async (examId, userId) => {
  // 1. Load exam
  const exam = await Exam.findById(examId).populate('course', 'title unit');

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published yet');
  }

  const now = new Date();

  // 2. Global window check: has the exam already closed for everyone?
  //    Example: scheduledAt = 8:00 PM, duration = 45 min
  //             globalDeadline = 8:45 PM
  //    If now > 8:45 PM, nobody can start — reject.
  const globalDeadline = getExamDeadline(exam);
  if (now > globalDeadline) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam window has closed');
  }

  // 3. Is there an existing attempt for this student?
  let attempt = await Attempt.findOne({ student: userId, exam: examId });

  if (attempt && attempt.status === 'submitted') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already attempted this exam'
    );
  }

  if (attempt && attempt.status === 'live') {
    // 4a. Resume path — student already started once
    //     Check whether their effective deadline has passed.
    //     Example: they started at 8:00 PM, personal deadline = 8:45 PM
    //              now is 8:50 PM → time is up
    const effectiveDeadline = getEffectiveDeadline(exam, attempt);
    if (now > effectiveDeadline) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Your time is up for this exam'
      );
    }
  } else {
    // 4b. First-time start — create a live attempt with startedAt = NOW.
    //     Example: student opens at 8:30 PM
    //              startedAt = 8:30 PM
    //              personal deadline = 9:15 PM
    //              BUT global deadline = 8:45 PM
    //              → effective deadline = 8:45 PM (earlier)
    //              → remaining = 15 min ✅
    attempt = await Attempt.create({
      student: userId,
      exam: examId,
      status: 'live',
      startedAt: now,
      draftAnswers: [],
    });
  }

  // 5. Group questions by subject (strip correct answers)
  const grouped = {};
  exam.questions.forEach((q) => {
    if (!grouped[q.subject]) grouped[q.subject] = [];
    grouped[q.subject].push({
      _id: q._id,
      question: q.question,
      images: q.images || [],
      options: q.options,
      subject: q.subject,
      marks: q.marks,
      order: q.order,
      // ❌ correctAnswer and explanation intentionally omitted
    });
  });

  // 6. Compute remaining time from effective deadline
  const effectiveDeadline = getEffectiveDeadline(exam, attempt);
  const remainingSeconds = Math.max(
    0,
    Math.floor((effectiveDeadline.getTime() - now.getTime()) / 1000)
  );

  // 7. Return payload — includes remaining time + resume data
  return {
    exam: {
      _id: exam._id,
      title: exam.title,
      unit: exam.unit,
      course: exam.course,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      negativeMark: exam.negativeMark,
      passMarks: exam.passMarks,
      englishMinMarks: exam.englishMinMarks,
      requiredOptionalCount: exam.requiredOptionalCount,
      sections: exam.sections,
      scheduledAt: exam.scheduledAt,
    },
    attemptId: attempt._id,
    remainingSeconds,                                       // ✅ 900 in the 8:30 PM scenario
    previousAnswers: attempt.draftAnswers || [],
    chosenOptionalSubjects: attempt.chosenOptionalSubjects || [],
    questionsBySubject: grouped,
  };
};

// ============ ✅ Student: Submit & Grade ============

const submitExam = async (examId, userId, { answers, chosenOptionalSubjects }) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');

  const attempt = await Attempt.findOne({ student: userId, exam: examId });
  if (!attempt) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No attempt to submit');
  }
  if (attempt.status === 'submitted') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already submitted');
  }

  // ✅ Determine compulsory vs optional
  const compulsorySubjects = exam.sections
    .filter((s) => s.isCompulsory)
    .map((s) => s.name);

  const optionalSubjects = exam.sections
    .filter((s) => !s.isCompulsory)
    .map((s) => s.name);

  // ✅ Validate optional count
  if (chosenOptionalSubjects.length !== exam.requiredOptionalCount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You must choose exactly ${exam.requiredOptionalCount} optional subjects`
    );
  }

  const invalid = chosenOptionalSubjects.filter(
    (s) => !optionalSubjects.includes(s)
  );
  if (invalid.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid optional subjects: ${invalid.join(', ')}`
    );
  }

  // ✅ Grade (same logic as before)
  let score = 0, correct = 0, wrong = 0, unanswered = 0;
  const subjectWiseMap = {};
  const gradedAnswers = [];

  exam.questions.forEach((q) => {
    const subject = q.subject;
    const isCompulsory = compulsorySubjects.includes(subject);
    const isChosen = chosenOptionalSubjects.includes(subject);
    if (!isCompulsory && !isChosen) return;

    if (!subjectWiseMap[subject]) {
      subjectWiseMap[subject] = {
        subject, correct: 0, wrong: 0, unanswered: 0, score: 0, totalMarks: 0,
      };
    }
    subjectWiseMap[subject].totalMarks += q.marks || 1;

    const studentAnswer = answers.find((a) => a.question === q._id.toString());

    if (!studentAnswer || studentAnswer.selectedOption == null) {
      unanswered++;
      subjectWiseMap[subject].unanswered++;
      gradedAnswers.push({
        question: q._id,
        subject,
        questionText: q.question,
        questionImages: q.images || [],
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
        questionText: q.question,
        questionImages: q.images || [],
        selectedOption: studentAnswer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: true,
        marks: m,
      });
    } else {
      wrong++;
      score -= exam.negativeMark;
      subjectWiseMap[subject].wrong++;
      subjectWiseMap[subject].score -= exam.negativeMark;
      gradedAnswers.push({
        question: q._id,
        subject,
        questionText: q.question,
        questionImages: q.images || [],
        selectedOption: studentAnswer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marks: -exam.negativeMark,
      });
    }
  });

  score = Math.max(0, score);
  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  const passedOverall = score >= exam.passMarks;
  const englishScore = subjectWiseMap['English']?.score || 0;
  const passedEnglish = englishScore >= exam.englishMinMarks;
  const isPassed = passedOverall && passedEnglish;

  // ✅ Update existing attempt — DO NOT create new
  attempt.chosenOptionalSubjects = chosenOptionalSubjects;
  attempt.answers = gradedAnswers;
  attempt.draftAnswers = [];   // clear draft
  attempt.score = Math.round(score * 100) / 100;
  attempt.correct = correct;
  attempt.wrong = wrong;
  attempt.unanswered = unanswered;
  attempt.accuracy = Math.round(accuracy * 100) / 100;
  attempt.subjectWise = Object.values(subjectWiseMap);
  attempt.isPassed = isPassed;
  attempt.passedOverall = passedOverall;
  attempt.passedEnglish = passedEnglish;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  return attempt;
};

// ============ ✅ Student: Save Draft ============

const saveDraft = async (examId, userId, { answers = [], chosenOptionalSubjects = [] }) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  if (!exam.isPublished) throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published');

  const attempt = await Attempt.findOne({ student: userId, exam: examId });
  if (!attempt || attempt.status !== 'live') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active attempt found');
  }

  // Time is up?
  if (new Date() > getEffectiveDeadline(exam, attempt)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Time is up');
  }

  attempt.draftAnswers = answers;
  if (chosenOptionalSubjects.length > 0) {
    attempt.chosenOptionalSubjects = chosenOptionalSubjects;
  }
  await attempt.save();

  return attempt;
};

module.exports = {
  createExam,
  queryExams,
  getExamById,
  updateExamById,
  deleteExamById,
  startExam,
  submitExam,
  saveDraft,
};