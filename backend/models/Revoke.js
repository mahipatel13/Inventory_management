'use strict';

const mongoose = require('mongoose');

const revokeSchema = new mongoose.Schema(
  {
    strengthEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strength',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Revoke', revokeSchema);