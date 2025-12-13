'use strict';

const Timetable = require('../models/Timetable');

const normalizeSemesterKey = (semesterParam) => {
  // Accept: "1" or "semester1" or "AIML1"
  const raw = String(semesterParam || '').trim();
  if (!raw) return null;

  if (/^semester\d+$/i.test(raw)) return raw.toLowerCase();
  if (/^\d+$/.test(raw)) return `semester${raw}`;

  const m = raw.match(/^AIML(\d+)$/i);
  if (m) return `semester${m[1]}`;

  return null;
};

const requireEditor = (req, res) => {
  // Allow both admin and staff to edit timetables.
  const role = req.user?.role;
  if (!req.user || (role !== 'admin' && role !== 'staff')) {
    res.status(403).json({ message: 'Editor access required' });
    return false;
  }
  return true;
};

const getTimetable = async (req, res) => {
  try {
    const key = normalizeSemesterKey(req.params.semester);
    if (!key) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    const doc = await Timetable.findOne({ semesterKey: key }).lean();
    if (!doc) {
      return res.status(404).json({ message: `Timetable for ${key} not found` });
    }

    return res.json({ name: doc.name, schedule: doc.schedule || [] });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return res.status(500).json({ message: 'Error fetching timetable data' });
  }
};

const getAllTimetables = async (_req, res) => {
  try {
    const docs = await Timetable.find({}).lean();
    const data = {};
    docs.forEach((d) => {
      data[d.semesterKey] = { name: d.name, schedule: d.schedule || [] };
    });
    return res.json(data);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return res.status(500).json({ message: 'Error fetching timetable data' });
  }
};

const updateTimetable = async (req, res) => {
  try {
    if (!requireEditor(req, res)) return;

    const key = normalizeSemesterKey(req.params.semester);
    if (!key) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    const { name, schedule } = req.body || {};
    if (!name || !Array.isArray(schedule)) {
      return res.status(400).json({ message: 'Body must include { name, schedule[] }' });
    }

    const doc = await Timetable.findOneAndUpdate(
      { semesterKey: key },
      { $set: { name, schedule, updatedBy: req.user?._id } },
      { new: true, upsert: true }
    ).lean();

    return res.json({ name: doc.name, schedule: doc.schedule || [] });
  } catch (error) {
    console.error('Error updating timetable:', error);
    return res.status(500).json({ message: 'Error updating timetable data' });
  }
};

const copyTimetableFromSemester = async (req, res) => {
  try {
    if (!requireEditor(req, res)) return;

    const targetKey = normalizeSemesterKey(req.params.target);
    const sourceKey = normalizeSemesterKey(req.params.source);
    if (!targetKey || !sourceKey) {
      return res.status(400).json({ message: 'Invalid target/source semester' });
    }

    const source = await Timetable.findOne({ semesterKey: sourceKey }).lean();
    if (!source) {
      return res.status(404).json({ message: `Source timetable ${sourceKey} not found` });
    }

    const existingTarget = await Timetable.findOne({ semesterKey: targetKey }).lean();
    const targetName = existingTarget?.name || source.name;

    const copiedSchedule = JSON.parse(JSON.stringify(source.schedule || []));

    const updated = await Timetable.findOneAndUpdate(
      { semesterKey: targetKey },
      { $set: { name: targetName, schedule: copiedSchedule, updatedBy: req.user?._id } },
      { new: true, upsert: true }
    ).lean();

    return res.json({ name: updated.name, schedule: updated.schedule || [] });
  } catch (error) {
    console.error('Error copying timetable:', error);
    return res.status(500).json({ message: 'Error copying timetable data' });
  }
};

module.exports = {
  getTimetable,
  getAllTimetables,
  updateTimetable,
  copyTimetableFromSemester,
};
