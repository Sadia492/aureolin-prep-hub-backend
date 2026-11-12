// backend/src/services/exam.service.js
const httpStatus = require('http-status').default;
const { Exam, Course, Attempt } = require('../models');
const ApiError = require('../utils/ApiError');

// ============ Helpers ============

// ✅ Total duration = MCQ duration + written duration (if enabled)
const getExamTotalDurationMin = (exam) =>
  (exam.duration || 0) + (exam.hasWrittenPart ? exam.writtenDuration || 0 : 0);

// ✅ MCQ is common; written questions differ per unit. Pick the set for a unit.
const getWrittenQuestionsForUnit = (exam, unit) => {
  if (unit === 'A Unit') return exam.writtenQuestionsA || [];
  if (unit === 'C Unit') return exam.writtenQuestionsC || [];
  return [];
};

// Group written questions by subject for the student UI
const groupWrittenBySubject = (questions = []) => {
  const grouped = {};
  questions.forEach((q) => {
    if (!grouped[q.subject]) grouped[q.subject] = [];
    grouped[q.subject].push({
      _id: q._id,
      question: q.question,
      images: q.images || [],
      subject: q.subject,
      marks: q.marks,
      order: q.order,
    });
  });
  return grouped;
};

// ============ CRUD ============

const createExam = async (examBody) => {
  if (examBody.course) {
    const course = await Course.findById(examBody.course);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    }
  }

  // Auto-order written questions for each unit
  ['writtenQuestionsA', 'writtenQuestionsC'].forEach((field) => {
    if (Array.isArray(examBody[field])) {
      examBody[field] = examBody[field].map((q, i) => ({
        ...q,
        order: q.order ?? i,
      }));
    }
  });
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

  // ✅ No auto-close block — remove it entirely
  return query;
};

const getExamById = async (examId) => {
  return Exam.findById(examId)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role');
};

// ✅ Merge incoming questions with the ones already on the server so two people
// editing the same exam never wipe each other's saved questions.
// - the editor's items keep their order / edits / brand-new questions
// - questions another editor saved (that this editor never loaded) are preserved
// - only the ids this editor explicitly deleted are actually removed
const mergeQuestionArray = (serverArr = [], incomingArr = [], removedIds = []) => {
  const removed = new Set((removedIds || []).map(String));
  const incomingIds = new Set(
    (incomingArr || []).filter((q) => q && q._id).map((q) => String(q._id))
  );

  const merged = (incomingArr || []).map((q) => ({ ...q }));

  (serverArr || []).forEach((s) => {
    const id = String(s._id);
    if (removed.has(id) || incomingIds.has(id)) return;
    merged.push(s.toObject ? s.toObject() : s);
  });

  return merged.map((q, i) => ({ ...q, order: q.order ?? i }));
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

  const removedQuestionIds = updateBody.removedQuestionIds || {};
  delete updateBody.removedQuestionIds;

  if (updateBody.sections) {
    updateBody.sections = updateBody.sections.map((s, i) => ({
      ...s,
      order: s.order ?? i,
    }));
  }
  if (updateBody.questions) {
    updateBody.questions = mergeQuestionArray(
      exam.questions,
      updateBody.questions,
      removedQuestionIds.questions
    );
  }
  ['writtenQuestionsA', 'writtenQuestionsC'].forEach((field) => {
    if (updateBody[field]) {
      updateBody[field] = mergeQuestionArray(
        exam[field],
        updateBody[field],
        removedQuestionIds[field]
      );
    }
  });

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

// ============ Atomic question additions (safe for concurrent editors) ============
// Appends questions with $push so another teacher/admin saving the exam at the
// same time can never wipe questions that were already saved.

const pushToExamArray = async (examId, field, questions, extraSet = null) => {
  const exam = await Exam.findById(examId).select(field);
  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  const baseCount = (exam[field] || []).length;
  const toPush = questions.map((q, i) => ({
    ...q,
    order: q.order ?? baseCount + i,
  }));

  const update = { $push: { [field]: { $each: toPush } } };
  if (extraSet) update.$set = extraSet;

  await Exam.findByIdAndUpdate(examId, update, { runValidators: true });

  return Exam.findById(examId)
    .populate('course', 'title unit')
    .populate('createdBy', 'name email role');
};

// ✅ Add MCQ questions without touching existing ones
const addMcqQuestions = async (examId, questions) =>
  pushToExamArray(examId, 'questions', questions);

// ✅ Add written questions for a unit without touching existing ones
const addWrittenQuestions = async (examId, unit, questions) => {
  const field = unit === 'A Unit' ? 'writtenQuestionsA' : 'writtenQuestionsC';
  return pushToExamArray(examId, field, questions, { hasWrittenPart: true });
};

// ============ Student: Start Exam ============

const startExam = async (examId, userId) => {
  const exam = await Exam.findById(examId).populate('course', 'title unit');

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  // ✅ Only gate: must be published
  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published yet');
  }

  const now = new Date();

  // ✅ Total personal duration = MCQ duration + written duration (if enabled)
  const totalDurationMin = getExamTotalDurationMin(exam);

  let attempt = await Attempt.findOne({ student: userId, exam: examId });

  if (attempt && attempt.status === 'submitted') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already attempted this exam'
    );
  }

  if (attempt && attempt.status === 'live') {
    // ✅ Resume the live attempt. There is no time-based auto-close —
    //    the exam stays open until a teacher/admin unpublishes it.
  } else {
    // ✅ First start: create live attempt with startedAt = NOW
    attempt = await Attempt.create({
      student: userId,
      exam: examId,
      status: 'live',
      startedAt: now,
      draftAnswers: [],
      draftWrittenAnswers: [],
    });
  }

  // Group MCQ questions by subject
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

  // ✅ Written units available to choose (only those that actually have questions)
  const writtenUnits = exam.hasWrittenPart
    ? ['A Unit', 'C Unit'].filter(
        (u) => getWrittenQuestionsForUnit(exam, u).length > 0
      )
    : [];

  // ✅ Only reveal the chosen unit's questions (student picks in the written tab)
  const chosenWrittenUnit = attempt.writtenUnit || null;
  const writtenQuestionsBySubject = chosenWrittenUnit
    ? groupWrittenBySubject(getWrittenQuestionsForUnit(exam, chosenWrittenUnit))
    : {};

  // ✅ Remaining seconds = personal deadline − now
  const personalDeadline = new Date(
    new Date(attempt.startedAt).getTime() + totalDurationMin * 60 * 1000
  );
  const remainingSeconds = Math.max(
    0,
    Math.floor((personalDeadline.getTime() - now.getTime()) / 1000)
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
    writtenUnit: chosenWrittenUnit,
    writtenUnits,
    questionsBySubject: grouped,
    writtenQuestionsBySubject,
  };
};

// ============ Student: Select written unit (reveals that unit's questions) ============

const selectWrittenUnit = async (examId, userId, writtenUnit) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  if (!exam.hasWrittenPart) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This exam has no written part');
  }

  const attempt = await Attempt.findOne({ student: userId, exam: examId });
  if (!attempt || attempt.status !== 'live') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active attempt found');
  }

  const questions = getWrittenQuestionsForUnit(exam, writtenUnit);
  if (questions.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `No written questions available for ${writtenUnit}`
    );
  }

  attempt.writtenUnit = writtenUnit;
  await attempt.save();

  return {
    writtenUnit,
    writtenQuestionsBySubject: groupWrittenBySubject(questions),
  };
};

// ============ Student: Submit (MCQ auto-graded, written left for teacher) ============

const submitExam = async (
  examId,
  userId,
  { answers = [], chosenOptionalSubjects = [], writtenAnswers = [], writtenUnit = null }
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
  const resolvedWrittenUnit = writtenUnit || attempt.writtenUnit || null;
  const writtenSnapshot = [];
  let writtenMaxTotal = 0;

  if (exam.hasWrittenPart) {
    getWrittenQuestionsForUnit(exam, resolvedWrittenUnit).forEach((q) => {
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
         modelAnswer: q.modelAnswer || "", // ✅ ADD THIS LINE
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

  attempt.writtenUnit = resolvedWrittenUnit;
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
  { answers = [], chosenOptionalSubjects = [], writtenAnswers = [], writtenUnit = null }
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

  // ✅ No time-based auto-close — drafts can be saved while the exam is published
  attempt.draftAnswers = answers;
  if (chosenOptionalSubjects.length > 0) {
    attempt.chosenOptionalSubjects = chosenOptionalSubjects;
  }
  if (writtenUnit) {
    attempt.writtenUnit = writtenUnit;
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
  const attempts = await Attempt.find(filter)
    .populate('student', 'name email role')
    .populate('exam', 'title unit hasWrittenPart writtenGraded')
    .sort({ submittedAt: -1 });

  return attempts;
};

module.exports = {
  createExam,
  queryExams,
  getExamById,
  updateExamById,
  deleteExamById,
  addMcqQuestions,
  addWrittenQuestions,
  startExam,
  selectWrittenUnit,
  submitExam,
  saveDraft,
  gradeWrittenAttempt,
  queryAttempts,
};