'use strict';

const mongoose = require('mongoose');

const revokeSchema = new mongoose.Schema(
  {
    isRevoked: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
    },
  },
  { _id: false }
);

const strengthSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    day: {
      type: String,
    },
    subject: {
      code: { type: String, required: true },
      name: { type: String, required: true },
    },
    faculty: {
      type: String,
      required: true,
    },
    slot: {
      type: String,
      required: true,
    },
    room: {
      name: { type: String, required: true },
      type: { type: String, enum: ['Lecture', 'Lab', 'Other'], required: true },
    },
    studentStrength: {
      type: Number,
      min: 0,
      required: true,
    },
    revoke: revokeSchema,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Strength', strengthSchema);