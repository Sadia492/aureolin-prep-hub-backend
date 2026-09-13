// backend/src/models/exam.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// ✅ Question as subdocument
// backend/src/models/exam.model.js — inside questionSubSchema
const questionSubSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },   // ✅ Add this
    options: { type: [String], required: true, validate: (v) => v.length === 4 },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '', trim: true },
    subject: { type: String, required: true, trim: true },
    marks: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: true, timestamps: false }
);

// ✅ Section as subdocument
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

    // ✅ Questions as subdocuments
    questions: {
      type: [questionSubSchema],
      default: [],
    },

    // Exam settings
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