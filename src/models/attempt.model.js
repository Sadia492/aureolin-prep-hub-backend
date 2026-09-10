// backend/src/models/attempt.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },

    chosenOptionalSubjects: [{ type: String }],

    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId },  // subdoc _id
        subject: { type: String },
        questionText: { type: String },        // snapshot
        selectedOption: { type: Number },
        correctAnswer: { type: Number },       // snapshot
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

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

attemptSchema.plugin(mongoosePaginate);
attemptSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);