'use strict';

const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, reportController.fetchReport);
router.get('/export', authMiddleware, reportController.exportReport);
router.get('/weekly/export', authMiddleware, reportController.exportWeeklyReport);
router.get('/monthly/export', authMiddleware, reportController.exportMonthlyReport);
// Save report to server filesystem
router.get('/save', authMiddleware, reportController.saveReport);
// Download a previously saved report by filename
router.get('/download', authMiddleware, reportController.downloadSavedReport);

module.exports = router;