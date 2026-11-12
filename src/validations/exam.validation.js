// backend/src/validations/exam.validation.js
const Joi = require('joi');

const WRITTEN_SUBJECTS = [
  'Bangla',
  'English',
  'ICT',
  'Mathematics',
  'Statistics',
  'Economics',
  'Accounting',
  'Business Organization',
  'Physics',
  'Chemistry',
  'Biology',
  'Higher Math',
];

const writtenQuestionSchema = Joi.object({
  _id: Joi.string().optional(),
  question: Joi.string().required(),
  images: Joi.array().items(Joi.string()).default([]),
  subject: Joi.string().required(), // allow any subject name
  marks: Joi.number().min(0).default(5),
  order: Joi.number().default(0),
  modelAnswer: Joi.string().allow('').default(''),
});

const mcqQuestionSchema = Joi.object({
  _id: Joi.string().optional(),
  question: Joi.string().required(),
  images: Joi.array().items(Joi.string()).default([]),
  options: Joi.array().items(Joi.string()).length(4).required(),
  correctAnswer: Joi.number().min(0).max(3).required(),
  explanation: Joi.string().allow('').default(''),
  subject: Joi.string().required(),
  marks: Joi.number().min(0).default(1),
  order: Joi.number().default(0),
});

const createExam = {
  body: Joi.object({
    title: Joi.string().required(),
    unit: Joi.string().valid('A Unit', 'C Unit', 'Both').default('Both'),
    course: Joi.string().allow(null, ''),

    sections: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        isCompulsory: Joi.boolean().default(false),
        order: Joi.number().default(0),
      })
    ),
    questions: Joi.array().items(mcqQuestionSchema).default([]),

    hasWrittenPart: Joi.boolean().default(false),
    writtenQuestionsA: Joi.array().items(writtenQuestionSchema).default([]),
    writtenQuestionsC: Joi.array().items(writtenQuestionSchema).default([]),
    writtenDuration: Joi.number().min(0).default(30),
    writtenTotalMarks: Joi.number().min(0).default(20),
    writtenPassMarks: Joi.number().min(0).default(8),
    writtenSeparatePass: Joi.boolean().default(true),

    duration: Joi.number().min(1).default(45),
    totalMarks: Joi.number().min(0).default(60),
    negativeMark: Joi.number().min(0).default(0.25),
    passMarks: Joi.number().min(0).default(24),
    englishMinMarks: Joi.number().min(0).default(5),
   requiredOptionalCount: Joi.number().min(0).default(1),

    scheduledAt: Joi.date().required(),
    isPublished: Joi.boolean().default(false),
  }),
};

const updateExam = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    title: Joi.string(),
    unit: Joi.string().valid('A Unit', 'C Unit', 'Both'),
    course: Joi.string().allow(null, ''),

    sections: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        isCompulsory: Joi.boolean(),
        order: Joi.number(),
      })
    ),
    questions: Joi.array().items(mcqQuestionSchema),

    hasWrittenPart: Joi.boolean(),
    writtenQuestionsA: Joi.array().items(writtenQuestionSchema),
    writtenQuestionsC: Joi.array().items(writtenQuestionSchema),

    // ✅ ids the editor explicitly deleted — lets the server merge instead of
    // blindly replacing the whole array (protects concurrent editors' questions)
    removedQuestionIds: Joi.object({
      questions: Joi.array().items(Joi.string()),
      writtenQuestionsA: Joi.array().items(Joi.string()),
      writtenQuestionsC: Joi.array().items(Joi.string()),
    }),

    writtenDuration: Joi.number().min(0),
    writtenTotalMarks: Joi.number().min(0),
    writtenPassMarks: Joi.number().min(0),
    writtenSeparatePass: Joi.boolean(),

    duration: Joi.number().min(1),
    totalMarks: Joi.number().min(0),
    negativeMark: Joi.number().min(0),
    passMarks: Joi.number().min(0),
    englishMinMarks: Joi.number().min(0),
    requiredOptionalCount: Joi.number().min(1),

    scheduledAt: Joi.date(),
    isPublished: Joi.boolean(),
  }).min(1),
};

const getExams = {
  query: Joi.object({
    unit: Joi.string().valid('A Unit', 'C Unit', 'Both'),
    isPublished: Joi.boolean(),
    search: Joi.string().allow(''),
    limit: Joi.number().integer().min(1),
  }),
};

const getExam = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
};

const deleteExam = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
};

// ✅ Append-only additions (omit `order` so the server assigns it atomically)
const addMcqQuestions = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    questions: Joi.array()
      .items(mcqQuestionSchema.keys({ order: Joi.number() }))
      .min(1)
      .required(),
  }),
};

const addWrittenQuestions = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    unit: Joi.string().valid('A Unit', 'C Unit').required(),
    questions: Joi.array()
      .items(writtenQuestionSchema.keys({ order: Joi.number() }))
      .min(1)
      .required(),
  }),
};

const selectWrittenUnit = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    writtenUnit: Joi.string().valid('A Unit', 'C Unit').required(),
  }),
};

const submitExam = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    answers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          selectedOption: Joi.number().allow(null),
        })
      )
      .default([]),
    chosenOptionalSubjects: Joi.array().items(Joi.string()).default([]),
    writtenUnit: Joi.string().valid('A Unit', 'C Unit').allow(null, '').default(null),

    writtenAnswers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          subject: Joi.string().optional(),
          answerText: Joi.string().allow('').default(''),
          answerImages: Joi.array().items(Joi.string()).default([]),
        })
      )
      .default([]),
  }),
};

const saveDraft = {
  params: Joi.object({
    examId: Joi.string().required(),
  }),
  body: Joi.object({
    answers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          selectedOption: Joi.number().allow(null),
        })
      )
      .default([]),
    chosenOptionalSubjects: Joi.array().items(Joi.string()).default([]),
    writtenUnit: Joi.string().valid('A Unit', 'C Unit').allow(null, '').default(null), // ✅ Added this
    writtenAnswers: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          subject: Joi.string().optional(),
          answerText: Joi.string().allow('').default(''),
          answerImages: Joi.array().items(Joi.string()).default([]),
        })
      )
      .default([]),
  }),
};

const gradeWritten = {
  params: Joi.object({
    attemptId: Joi.string().required(),
  }),
  body: Joi.object({
    grades: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          awardedMarks: Joi.number().min(0).required(),
          feedback: Joi.string().allow('').default(''),
        })
      )
      .required(),
  }),
};

module.exports = {
  createExam,
  updateExam,
  getExams,
  getExam,
  deleteExam,
  addMcqQuestions,
  addWrittenQuestions,
  selectWrittenUnit,
  submitExam,
  saveDraft,
  gradeWritten,
};