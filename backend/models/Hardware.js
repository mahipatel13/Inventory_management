'use strict';

const mongoose = require('mongoose');

// In backend/models/Hardware.js
const hardwareSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // Optional but strongly recommended (used by "Common Items" issue flow)
  code: { type: String, trim: true, uppercase: true, index: true },
  totalCount: { type: Number, required: true, min: 0 },
  availableCount: { type: Number, required: true, min: 0 },
  issuedCount: { type: Number, default: 0, min: 0 }, // Ensure this line exists
  remarks: { type: String, default: '', trim: true },
}, { timestamps: true });

// Prevent duplicate codes when provided
hardwareSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Hardware', hardwareSchema);
