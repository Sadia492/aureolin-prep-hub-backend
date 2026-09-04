const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    negativeMark: {
      type: Number,
      default: 0,
      min: 0,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

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
