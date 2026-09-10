// backend/src/models/material.model.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Lecture Note', 'Practice Sheet', 'Previous Questions', 'Exam Solution', 'PDF', 'Video'],
      default: 'PDF',
    },
    fileUrl: {
      type: String,
      required: true,     // Cloudinary URL
    },
    filePublicId: {
      type: String,       // Cloudinary public_id (for deletion)
    },
    fileSize: {
      type: Number,       // bytes
    },
    fileFormat: {
      type: String,       // 'pdf', 'docx', 'jpg'
    },
    // Optional: restrict to specific course/unit
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,      // null = available to all
    },
    targetUnit: {
      type: String,       // 'A Unit', 'C Unit', 'A & C Unit', or null for all
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

materialSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Material', materialSchema);