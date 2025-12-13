const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
  getTimetable,
  getAllTimetables,
  updateTimetable,
  copyTimetableFromSemester,
} = require('../controllers/timetableController');

// Read access for any authenticated user
router.get('/semester/:semester', authMiddleware, getTimetable);
router.get('/', authMiddleware, getAllTimetables);

// Admin-only editing endpoints
router.put('/semester/:semester', authMiddleware, updateTimetable);
router.post('/semester/:target/copy-from/:source', authMiddleware, copyTimetableFromSemester);

module.exports = router;
