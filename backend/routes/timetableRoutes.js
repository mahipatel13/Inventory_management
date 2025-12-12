const express = require('express');
const router = express.Router();
const { getTimetable, getAllTimetables } = require('../controllers/timetableController');

router.get('/semester/:semester', getTimetable);
router.get('/', getAllTimetables);

module.exports = router;