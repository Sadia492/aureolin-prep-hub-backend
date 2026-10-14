// backend/src/services/exam.service.js
const httpStatus = require('http-status').default;
const { Exam, Course, Attempt } = require('../models');
const ApiError = require('../utils/ApiError');
const {
  getExamDeadline,
  getEffectiveDeadline,
} = require('../config/examHelpers');

// ============ Helpers ============

// ✅ Total duration = MCQ duration + written duration (if enabled)
const getExamTotalDurationMin = (exam) =>
  (exam.duration || 0) + (exam.hasWrittenPart ? exam.writtenDuration || 0 : 0);

// Return a shallow copy of exam with adjusted duration for deadline math
const examForDeadline = (exam) => {
  const obj = exam.toObject ? exam.toObject() : { ...exam };
  return { ...obj, duration: getExamTotalDurationMin(exam) };
};

// ============ CRUD ============

const createExam = async (examBody) => {
  if (examBody.course) {
    const course = await Course.findById(examBody.course);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    }
  }

  // Auto-order written questions
  if (Array.isArray(examBody.writtenQuestions)) {
    examBody.writtenQuestions = examBody.writtenQuestions.map((q, i) => ({
      ...q,
      order: q.order ?? i,
    }));
  }
  if (Array.isArray(examBody.questions)) {
    examBody.questions = examBody.questions.map((q, i) => ({
      ...q,
      order: q.order ?? i,
    }));
  }
  if (Array.isArray(examBody.sections)) {
    examBody.sections = examBody.sections.map((s, i) => ({
      ...s,
      order: s.order ?? i,
    }));
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
      $or: [{ course: { $in: courseIds } }, { course: null }],
    };
  }

  const query = Exam.find(queryFilter)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role')
    .sort({ scheduledAt: -1 });

  if (options.limit) query.limit(options.limit);

  return query;
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

  if (updateBody.sections) {
    updateBody.sections = updateBody.sections.map((s, i) => ({
      ...s,
      order: s.order ?? i,
    }));
  }
  if (updateBody.questions) {
    updateBody.questions = updateBody.questions.map((q, i) => ({
      ...q,
      order: q.order ?? i,
    }));
  }
  if (updateBody.writtenQuestions) {
    updateBody.writtenQuestions = updateBody.writtenQuestions.map((q, i) => ({
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

// ============ Student: Start Exam ============

const startExam = async (examId, userId) => {
  const exam = await Exam.findById(examId).populate('course', 'title unit');

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published yet');
  }

  const now = new Date();
  const examWithWrittenDuration = examForDeadline(exam);

  const globalDeadline = getExamDeadline(examWithWrittenDuration);
  if (now > globalDeadline) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam window has closed');
  }

  let attempt = await Attempt.findOne({ student: userId, exam: examId });

  if (attempt && attempt.status === 'submitted') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already attempted this exam'
    );
  }

  if (attempt && attempt.status === 'live') {
    const effectiveDeadline = getEffectiveDeadline(examWithWrittenDuration, attempt);
    if (now > effectiveDeadline) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your time is up for this exam');
    }
  } else {
    attempt = await Attempt.create({
      student: userId,
      exam: examId,
      status: 'live',
      startedAt: now,
      draftAnswers: [],
      draftWrittenAnswers: [],
    });
  }

  // Group MCQ questions by subject (strip correct answers)
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
    });
  });

  // Group written questions by subject
  const groupedWritten = {};
  if (exam.hasWrittenPart) {
    exam.writtenQuestions.forEach((q) => {
      if (!groupedWritten[q.subject]) groupedWritten[q.subject] = [];
      groupedWritten[q.subject].push({
        _id: q._id,
        question: q.question,
        images: q.images || [],
        subject: q.subject,
        marks: q.marks,
        order: q.order,
      });
    });
  }

  const effectiveDeadline = getEffectiveDeadline(examWithWrittenDuration, attempt);
  const remainingSeconds = Math.max(
    0,
    Math.floor((effectiveDeadline.getTime() - now.getTime()) / 1000)
  );

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
      // written config
      hasWrittenPart: exam.hasWrittenPart,
      writtenDuration: exam.writtenDuration,
      writtenTotalMarks: exam.writtenTotalMarks,
      writtenPassMarks: exam.writtenPassMarks,
      writtenSeparatePass: exam.writtenSeparatePass,
    },
    attemptId: attempt._id,
    remainingSeconds,
    previousAnswers: attempt.draftAnswers || [],
    previousWrittenAnswers: attempt.draftWrittenAnswers || [],
    chosenOptionalSubjects: attempt.chosenOptionalSubjects || [],
    questionsBySubject: grouped,
    writtenQuestionsBySubject: groupedWritten,
  };
};

// ============ Student: Submit (MCQ auto-graded, written left for teacher) ============

const submitExam = async (
  examId,
  userId,
  { answers = [], chosenOptionalSubjects = [], writtenAnswers = [] }
) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');

  const attempt = await Attempt.findOne({ student: userId, exam: examId });
  if (!attempt) throw new ApiError(httpStatus.BAD_REQUEST, 'No attempt to submit');
  if (attempt.status === 'submitted') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already submitted');
  }

  const compulsorySubjects = exam.sections
    .filter((s) => s.isCompulsory)
    .map((s) => s.name);
  const optionalSubjects = exam.sections
    .filter((s) => !s.isCompulsory)
    .map((s) => s.name);

  if (chosenOptionalSubjects.length !== exam.requiredOptionalCount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You must choose exactly ${exam.requiredOptionalCount} optional subject(s)`
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

  // ===== MCQ grading =====
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
        subject,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        score: 0,
        totalMarks: 0,
      };
    }
    subjectWiseMap[subject].totalMarks += q.marks || 1;

    const studentAnswer = answers.find(
      (a) => a.question === q._id.toString()
    );

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
  const mcqPassed = passedOverall && passedEnglish;

  // ===== Written snapshot (NOT graded) =====
  const writtenSnapshot = [];
  let writtenMaxTotal = 0;

  if (exam.hasWrittenPart) {
    exam.writtenQuestions.forEach((q) => {
      const isCompulsory = compulsorySubjects.includes(q.subject);
      const isChosen = chosenOptionalSubjects.includes(q.subject);
      if (!isCompulsory && !isChosen) return;

      const sa = writtenAnswers.find(
        (a) => a.question === q._id.toString()
      );
      const answerImages = sa?.answerImages || [];
      const answerText = sa?.answerText || '';

      writtenMaxTotal += q.marks || 0;

      writtenSnapshot.push({
        question: q._id,
        subject: q.subject,
        questionText: q.question,
        questionImages: q.images || [],
        answerText,
        answerImages,
        maxMarks: q.marks || 0,
        awardedMarks: null, // teacher will fill
        feedback: '',
        graded: false,
      });
    });
  }

  attempt.chosenOptionalSubjects = chosenOptionalSubjects;
  attempt.answers = gradedAnswers;
  attempt.draftAnswers = [];

  attempt.score = Math.round(score * 100) / 100;
  attempt.correct = correct;
  attempt.wrong = wrong;
  attempt.unanswered = unanswered;
  attempt.accuracy = Math.round(accuracy * 100) / 100;
  attempt.subjectWise = Object.values(subjectWiseMap);
  attempt.passedOverall = passedOverall;
  attempt.passedEnglish = passedEnglish;

  attempt.writtenAnswers = writtenSnapshot;
  attempt.draftWrittenAnswers = [];
  attempt.writtenTotalMarks = writtenMaxTotal;
  attempt.writtenAwardedMarks = 0;
  attempt.writtenGraded = !exam.hasWrittenPart; // no written → nothing to grade
  attempt.writtenPassed = exam.hasWrittenPart ? null : true;

  // Final pass: if no written part → use MCQ result. Else pending until graded.
  attempt.isPassed = exam.hasWrittenPart ? false : mcqPassed;

  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  return attempt;
};

// ============ Student: Save Draft ============

const saveDraft = async (
  examId,
  userId,
  { answers = [], chosenOptionalSubjects = [], writtenAnswers = [] }
) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published');
  }

  const attempt = await Attempt.findOne({ student: userId, exam: examId });
  if (!attempt || attempt.status !== 'live') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active attempt found');
  }

  const examWithWrittenDuration = examForDeadline(exam);
  if (new Date() > getEffectiveDeadline(examWithWrittenDuration, attempt)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Time is up');
  }

  attempt.draftAnswers = answers;
  if (chosenOptionalSubjects.length > 0) {
    attempt.chosenOptionalSubjects = chosenOptionalSubjects;
  }
  if (exam.hasWrittenPart) {
    attempt.draftWrittenAnswers = writtenAnswers;
  }
  await attempt.save();

  return attempt;
};

// ============ Teacher: Grade Written ============

const gradeWrittenAttempt = async (attemptId, grades, user) => {
  const attempt = await Attempt.findById(attemptId).populate('exam');
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');

  const exam = attempt.exam;
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  if (!exam.hasWrittenPart) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This exam has no written part');
  }
  if (attempt.status !== 'submitted') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attempt is not submitted');
  }

  // grades: [{ question, awardedMarks, feedback }]
  let awardedTotal = 0;

  attempt.writtenAnswers = attempt.writtenAnswers.map((wa) => {
    const g = grades.find(
      (x) => String(x.question) === String(wa.question)
    );
    if (!g) return wa;

    const clamped = Math.max(
      0,
      Math.min(wa.maxMarks, Number(g.awardedMarks) || 0)
    );
    awardedTotal += clamped;

    return {
      ...wa,
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
  if (exam.writtenSeparatePass) {
    attempt.isPassed = mcqPassed && writtenPassed;
  } else {
    // Only affects total score (no separate pass rule)
    attempt.isPassed = mcqPassed;
  }

  await attempt.save();

  return Attempt.findById(attemptId)
    .populate('exam', 'title unit hasWrittenPart writtenPassMarks writtenSeparatePass')
    .populate('student', 'name email');
};

// ============ Query attempts (for teacher grading UI) ============

const queryAttempts = async (filter = {}, options = {}) => {
  const query = Attempt.find(filter)
    .populate('student', 'name email')
    .populate('exam', 'title unit hasWrittenPart writtenGraded')
    .sort({ submittedAt: -1 });

  if (options.limit) query.limit(options.limit);
  return query;
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
  gradeWrittenAttempt,
  queryAttempts,
};