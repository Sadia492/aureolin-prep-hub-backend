const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },

    explanation: {
      type: String,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

questionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Question', questionSchema);
