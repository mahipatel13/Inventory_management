'use strict';

const dayjs = require('dayjs');
const Strength = require('../models/Strength');
const Revoke = require('../models/Revoke');

const createStrengthEntry = async (req, res) => {
  try {
    const {
      semester,
      day,
      subject,
      subjectName,
      slot,
      room,
      type,
      faculty,
      studentStrength,
      revoke,
      revokeReason,
      date,
    } = req.body;

    if (!semester || !day || !subject || !slot || !room || !type || !faculty || studentStrength === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const entryDate = date ? dayjs(date).startOf('day').toDate() : dayjs().startOf('day').toDate();

    const strengthEntry = await Strength.create({
      date: entryDate,
      semester,
      day,
      subject: {
        code: subject,
        name: subjectName || subject,
      },
      faculty,
      slot,
      room: {
        name: room,
        type,
      },
      studentStrength,
      revoke: {
        isRevoked: revoke || false,
        reason: revoke ? revokeReason : undefined,
      },
      createdBy: req.user?.userId,
    });

    if (revoke && revokeReason) {
      await Revoke.create({
        strengthEntry: strengthEntry._id,
        reason: revokeReason,
        date: entryDate,
      });
    }

    return res.status(201).json({ message: 'Strength entry created.', data: strengthEntry });
  } catch (error) {
    console.error('Create strength entry error', error);
    return res.status(500).json({ message: 'Unable to create strength entry.' });
  }
};

const getDailySummary = async (req, res) => {
  try {
    const { semester } = req.query;

    const query = {};  // Empty query to get all entries
    if (semester) query.semester = semester;

    const entries = await Strength.find(query).sort({ createdAt: -1 });

    const data = entries.map((entry) => ({
      slot: entry.slot,
      subject: entry.subject.name,
      faculty: entry.faculty,
      roomName: entry.room.name,
      roomType: entry.room.type,
      studentStrength: entry.studentStrength,
      revoke: entry.revoke?.isRevoked
        ? {
            reason: entry.revoke.reason,
          }
        : null,
      // add date, day and semester so frontend can display/filter them without UI changes
      date: dayjs(entry.date).format('YYYY-MM-DD'),
      day: entry.day || null,
      semester: entry.semester || null,
      createdAt: entry.createdAt, // Include creation timestamp for display
      time: dayjs(entry.createdAt).format('HH:mm:ss'), // Add formatted time
    }));

    return res.json({ data });
  } catch (error) {
    console.error('Daily summary error', error);
    return res.status(500).json({ message: 'Unable to fetch summary.' });
  }
};

const listRevokes = async (_req, res) => {
  try {
    const revokes = await Revoke.find()
      .populate('strengthEntry')
      .sort({ createdAt: -1 })
      .limit(50);

    const data = revokes.map((item) => ({
      id: item._id,
      semester: item.strengthEntry.semester,
      subject: item.strengthEntry.subject.name,
      slot: item.strengthEntry.slot,
      room: item.strengthEntry.room.name,
      date: dayjs(item.date).format('YYYY-MM-DD'),
      reason: item.reason,
    }));

    return res.json({ data });
  } catch (error) {
    console.error('List revokes error', error);
    return res.status(500).json({ message: 'Unable to fetch revokes.' });
  }
};

module.exports = {
  createStrengthEntry,
  getDailySummary,
  listRevokes,
};