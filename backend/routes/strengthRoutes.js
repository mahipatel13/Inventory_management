'use strict';

const express = require('express');
const strengthController = require('../controllers/strengthController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, strengthController.createStrengthEntry);
router.get('/summary/daily', authMiddleware, strengthController.getDailySummary);
router.get('/revokes', authMiddleware, strengthController.listRevokes);

module.exports = router;