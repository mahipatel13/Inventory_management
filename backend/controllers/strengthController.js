'use strict';

const dayjs = require('dayjs');
const mongoose = require('mongoose');
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
      _id: entry._id.toString(),
      id: entry._id.toString(),
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

    // console.log('Sending summary data:', JSON.stringify(data.slice(0, 2), null, 2)); // Debug log

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

const deleteStrengthEntry = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete entry with ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID format');
      return res.status(400).json({ message: 'Invalid entry id.' });
    }

    const deleted = await Strength.findByIdAndDelete(id);
    if (!deleted) {
      console.log('Entry not found with ID:', id);
      return res.status(404).json({ message: 'Strength entry not found.' });
    }

    console.log('Entry deleted successfully:', id);

    // Clean up any revoke records linked to this entry.
    await Revoke.deleteMany({ strengthEntry: id });

    return res.json({ message: 'Strength entry deleted.' });
  } catch (error) {
    console.error('Delete strength entry error', error);
    return res.status(500).json({ message: 'Unable to delete strength entry.' });
  }
};

// Fallback delete (for older clients / older summary payloads without _id)
// Supports either:
// - DELETE /api/strength?createdAt=ISO
// - or a safer composite match:
//   DELETE /api/strength?date=YYYY-MM-DD&semester=S5&slot=09:10%20-%2010:10&subject=ML%20Lab&faculty=AHP&roomName=322-A&roomType=Lab&studentStrength=67
const deleteStrengthEntryByMeta = async (req, res) => {
  try {
    const {
      createdAt,
      date,
      semester,
      slot,
      subject,
      faculty,
      roomName,
      roomType,
      studentStrength,
    } = req.query;

    let query = null;

    if (createdAt) {
      const createdAtDate = new Date(createdAt);
      if (Number.isNaN(createdAtDate.getTime())) {
        return res.status(400).json({ message: 'Invalid createdAt value.' });
      }
      query = { createdAt: createdAtDate };
    } else {
      // Require enough fields to uniquely identify the record.
      if (!date || !semester || !slot || !subject || !faculty || !roomName || !roomType) {
        return res.status(400).json({
          message:
            'Either createdAt or (date, semester, slot, subject, faculty, roomName, roomType) must be provided.',
        });
      }

      const dayDate = dayjs(date).startOf('day').toDate();
      const nextDayDate = dayjs(date).add(1, 'day').startOf('day').toDate();
      const strengthNum = studentStrength !== undefined ? Number(studentStrength) : undefined;

      query = {
        date: { $gte: dayDate, $lt: nextDayDate },
        semester,
        slot,
        faculty,
        'subject.name': subject,
        'room.name': roomName,
        'room.type': roomType,
      };

      if (strengthNum !== undefined && !Number.isNaN(strengthNum)) {
        query.studentStrength = strengthNum;
      }
    }

    console.log('Attempting delete by meta with query:', JSON.stringify(query));

    const deleted = await Strength.findOneAndDelete(query);
    if (!deleted) {
      console.log('Meta delete failed: Entry not found');
      return res.status(404).json({ message: 'Strength entry not found.' });
    }

    console.log('Meta delete successful:', deleted._id);

    await Revoke.deleteMany({ strengthEntry: deleted._id });

    return res.json({ message: 'Strength entry deleted.' });
  } catch (error) {
    console.error('Delete strength entry (meta) error', error);
    return res.status(500).json({ message: 'Unable to delete strength entry.' });
  }
};

module.exports = {
  createStrengthEntry,
  getDailySummary,
  listRevokes,
  deleteStrengthEntry,
  deleteStrengthEntryByMeta,
};
