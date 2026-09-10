// backend/src/services/exam.service.js
const httpStatus = require('http-status').default;
const { Exam, Course, Attempt } = require('../models');
const ApiError = require('../utils/ApiError');

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

const startExam = async (examId, userId) => {
  const exam = await Exam.findById(examId)
    .populate('course', 'title unit');

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published yet');
  }

  // Prevent duplicate attempt
  const existing = await Attempt.findOne({ student: userId, exam: examId });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already attempted this exam');
  }

  // ✅ Group questions by subject, STRIP correct answers
  const grouped = {};
  exam.questions.forEach((q) => {
    if (!grouped[q.subject]) grouped[q.subject] = [];
    grouped[q.subject].push({
      _id: q._id,
      question: q.question,
      options: q.options,
      subject: q.subject,
      marks: q.marks,
      order: q.order,
      // ❌ correctAnswer and explanation intentionally omitted
    });
  });

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
    questionsBySubject: grouped,
  };
};

// ============ ✅ Student: Submit & Grade ============

const submitExam = async (examId, userId, { answers, chosenOptionalSubjects }) => {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
  }

  if (!exam.isPublished) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Exam is not published');
  }

  const existing = await Attempt.findOne({ student: userId, exam: examId });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already submitted this exam');
  }

  // ✅ Determine compulsory vs optional subjects from sections
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

  // ✅ Grade
  let score = 0, correct = 0, wrong = 0, unanswered = 0;
  const subjectWiseMap = {};
  const gradedAnswers = [];

  exam.questions.forEach((q) => {
    const subject = q.subject;
    const isCompulsory = compulsorySubjects.includes(subject);
    const isChosen = chosenOptionalSubjects.includes(subject);

    // Skip optional subjects not chosen
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

    // Unanswered
    if (!studentAnswer || studentAnswer.selectedOption == null) {
      unanswered++;
      subjectWiseMap[subject].unanswered++;
      gradedAnswers.push({
        question: q._id,
        subject,
        questionText: q.question,
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

  const attempt = await Attempt.create({
    student: userId,
    exam: examId,
    chosenOptionalSubjects,
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
    submittedAt: new Date(),
  });

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
};