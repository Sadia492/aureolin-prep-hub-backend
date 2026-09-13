// backend/src/models/attempt.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },

    // ✅ NEW: attempt lifecycle
    status: {
      type: String,
      enum: ['live', 'submitted'],
      default: 'live',
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },   // ✅ only set on real submit

    chosenOptionalSubjects: [{ type: String }],

    // ✅ NEW: draft answers (autosaved during the exam)
    draftAnswers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId },
        selectedOption: { type: Number },
      },
    ],

    // Final graded answers (populated on submit)
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId },
        subject: { type: String },
        questionText: { type: String },
        questionImages: { type: [String], default: [] },
        selectedOption: { type: Number },
        correctAnswer: { type: Number },
        isCorrect: { type: Boolean },
        marks: { type: Number, default: 0 },
      },
    ],

    score: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    accuracy: { type: Number },

    subjectWise: [
      {
        subject: { type: String },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        unanswered: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        totalMarks: { type: Number },
      },
    ],

    isPassed: { type: Boolean },
    passedOverall: { type: Boolean },
    passedEnglish: { type: Boolean },
  },
  { timestamps: true, versionKey: false }
);

attemptSchema.plugin(mongoosePaginate);

// ✅ Only ONE attempt per student per exam
attemptSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);