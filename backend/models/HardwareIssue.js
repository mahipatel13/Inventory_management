'use strict';

const mongoose = require('mongoose');

const hardwareIssueSchema = new mongoose.Schema(
  {
    hardware: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware', required: true },
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    contact: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    semester: { type: String, default: '', trim: true },
    period: { type: String, default: '', trim: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    remarks: { type: String, default: '', trim: true },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HardwareIssue', hardwareIssueSchema);
