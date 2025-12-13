'use strict';

const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

router.post('/forgot-password/request', authController.requestPasswordReset);
router.post('/forgot-password/reset', authController.resetPasswordWithOtp);

module.exports = router;
