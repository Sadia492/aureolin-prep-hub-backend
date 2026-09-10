// backend/src/models/question.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: 'Exactly 4 options required',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: { type: String, trim: true },
    subject: {
      type: String,
      required: true,
      enum: [
        'Bangla', 'English', 'ICT',
        // A Unit optionals
        'Accounting', 'Business Organization', 'Economics', 'Statistics', 'Mathematics',
        // C Unit optionals
        'Physics', 'Chemistry', 'Biology', 'Higher Math',
      ],
    },
    marks: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

questionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Question', questionSchema);