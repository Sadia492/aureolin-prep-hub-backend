// backend/src/models/exam.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// ✅ MCQ Question subdocument
const questionSubSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    options: {
      type: [String],
      required: true,
      validate: (v) => v.length === 4,
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '', trim: true },
    subject: { type: String, required: true, trim: true },
    marks: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: true, timestamps: false }
);

// ✅ Written Question subdocument (teacher types; student uploads images)
const writtenQuestionSubSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    images: { type: [String], default: [] }, // reference images from admin
    subject: {
      type: String,
      required: true,
      trim: true,
      enum: ['Bangla', 'English', 'ICT', 'Mathematics', 'Statistics', 'Economics'],
    },
    marks: { type: Number, default: 5, min: 0 },
    order: { type: Number, default: 0 },
    modelAnswer: { type: String, default: '', trim: true }, // optional rubric
  },
  { _id: true, timestamps: false }
);

// ✅ Section subdocument
const sectionSubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isCompulsory: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    unit: {
      type: String,
      enum: ['A Unit', 'C Unit'],
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },

    // ✅ Sections
    sections: {
      type: [sectionSubSchema],
      default: [],
    },

    // ✅ MCQ questions
    questions: {
      type: [questionSubSchema],
      default: [],
    },

    // ✅ Written part config
    hasWrittenPart: { type: Boolean, default: false },
    writtenQuestions: { type: [writtenQuestionSubSchema], default: [] },
    writtenDuration: { type: Number, default: 30, min: 0 },
    writtenTotalMarks: { type: Number, default: 20, min: 0 },
    writtenPassMarks: { type: Number, default: 8, min: 0 },
    writtenSeparatePass: { type: Boolean, default: true },

    // MCQ settings
    duration: { type: Number, default: 45, min: 1 },
    totalMarks: { type: Number, default: 60, min: 0 },
    negativeMark: { type: Number, default: 0.25, min: 0 },
    passMarks: { type: Number, default: 24, min: 0 },
    englishMinMarks: { type: Number, default: 5, min: 0 },
    requiredOptionalCount: { type: Number, default: 1, min: 1 },

    scheduledAt: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

examSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Exam', examSchema);