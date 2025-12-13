'use strict';

const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    // e.g. "semester1", "semester2" ...
    semesterKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Keep schedule flexible (matches existing timetables.json structure)
    schedule: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);
