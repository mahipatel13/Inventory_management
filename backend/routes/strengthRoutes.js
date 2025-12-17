'use strict';

const express = require('express');
const strengthController = require('../controllers/strengthController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', strengthController.createStrengthEntry);
router.get('/summary/daily', authMiddleware, strengthController.getDailySummary);
router.get('/revokes', authMiddleware, strengthController.listRevokes);
router.delete('/', authMiddleware, strengthController.deleteStrengthEntryByMeta);
router.delete('/:id', authMiddleware, strengthController.deleteStrengthEntry);

module.exports = router;