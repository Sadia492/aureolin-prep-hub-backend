// backend/src/models/qna.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const qnaSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    answer: {
      type: String,
      trim: true,
    },

    answerImages: {
      type: [String],
      default: [],
    },

    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    status: {
      type: String,
      enum: ['pending', 'answered'],
      default: 'pending',
    },

    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

qnaSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('QnA', qnaSchema);