const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: Number,
    },
    isCorrect: {
      type: Boolean,
    },
    marks: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },

    answers: [answerSchema],

    score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    correct: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    wrong: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    unanswered: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },

    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

attemptSchema.plugin(mongoosePaginate);

attemptSchema.index({ student: 1, exam: 1 }, { unique: false });

module.exports = mongoose.model('Attempt', attemptSchema);
