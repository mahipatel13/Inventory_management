const fs = require('fs');
const path = require('path');

const timetablePath = path.join(__dirname, '../data/timetables.json');

const readTimetables = () => JSON.parse(fs.readFileSync(timetablePath, 'utf8'));
const writeTimetables = (data) => {
  // Note: for multi-instance deployments this won't be shared. For a single-node app, file persistence is fine.
  fs.writeFileSync(timetablePath, JSON.stringify(data, null, 2), 'utf8');
};

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

const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
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

    const data = readTimetables();

    if (!data[key]) {
      return res.status(404).json({ message: `Timetable for ${key} not found` });
    }

    return res.json(data[key]);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return res.status(500).json({ message: 'Error fetching timetable data' });
  }
};

const getAllTimetables = async (_req, res) => {
  try {
    const data = readTimetables();
    return res.json(data);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return res.status(500).json({ message: 'Error fetching timetable data' });
  }
};

const updateTimetable = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const key = normalizeSemesterKey(req.params.semester);
    if (!key) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    const { name, schedule } = req.body || {};
    if (!name || !Array.isArray(schedule)) {
      return res.status(400).json({ message: 'Body must include { name, schedule[] }' });
    }

    const data = readTimetables();
    data[key] = { name, schedule };
    writeTimetables(data);

    return res.json(data[key]);
  } catch (error) {
    console.error('Error updating timetable:', error);
    return res.status(500).json({ message: 'Error updating timetable data' });
  }
};

const copyTimetableFromSemester = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const targetKey = normalizeSemesterKey(req.params.target);
    const sourceKey = normalizeSemesterKey(req.params.source);
    if (!targetKey || !sourceKey) {
      return res.status(400).json({ message: 'Invalid target/source semester' });
    }

    const data = readTimetables();
    if (!data[sourceKey]) {
      return res.status(404).json({ message: `Source timetable ${sourceKey} not found` });
    }

    // Keep target name (if exists), copy schedule.
    const existingTarget = data[targetKey];
    const targetName = existingTarget?.name || data[sourceKey].name;

    data[targetKey] = {
      name: targetName,
      schedule: JSON.parse(JSON.stringify(data[sourceKey].schedule || [])),
    };

    writeTimetables(data);
    return res.json(data[targetKey]);
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
