const fs = require('fs');
const path = require('path');

const getTimetable = async (req, res) => {
    try {
        const semester = req.params.semester;
        const timetablePath = path.join(__dirname, '../data/timetables.json');
        const timetableData = JSON.parse(fs.readFileSync(timetablePath, 'utf8'));

        if (!timetableData[`semester${semester}`]) {
            return res.status(404).json({ message: `Timetable for semester ${semester} not found` });
        }

        res.json(timetableData[`semester${semester}`]);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ message: 'Error fetching timetable data' });
    }
};

const getAllTimetables = async (req, res) => {
    try {
        const timetablePath = path.join(__dirname, '../data/timetables.json');
        const timetableData = JSON.parse(fs.readFileSync(timetablePath, 'utf8'));
        res.json(timetableData);
    } catch (error) {
        console.error('Error fetching timetables:', error);
        res.status(500).json({ message: 'Error fetching timetable data' });
    }
};

module.exports = {
    getTimetable,
    getAllTimetables
};