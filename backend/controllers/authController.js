'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const hashOtp = (otp) => {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET || 'aiml-secret';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'aiml-secret',
      { expiresIn: '12h' }
    );

    return res.json({ token, username: user.username, role: user.role });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    const user = await User.create({
      username,
      email: email || '',
      password,
      role: 'staff'
    });

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@charusat.ac.in')) {
      return res.status(400).json({ message: 'Email must be a Gmail (@gmail.com) or Charusat (@charusat.ac.in) address.' });
    }

    const user = await User.findOne({ email: email.trim() });

    // For security, respond the same way even if user doesn't exist.
    if (!user) {
      return res.json({ message: 'If the account exists, an OTP has been sent to the registered email.' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'No email is configured for this user.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendMail({
      to: user.email,
      subject: 'Password reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      html: `<p>Your OTP for password reset is:</p><h2 style="letter-spacing:2px">${otp}</h2><p>It is valid for <b>10 minutes</b>.</p>`,
    });

    return res.json({ message: 'If the account exists, an OTP has been sent to the registered email.' });
  } catch (error) {
    console.error('Request password reset error', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !email.trim() || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP or expired OTP.' });
    }

    if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({ message: 'Invalid OTP or expired OTP.' });
    }

    if (new Date(user.resetOtpExpiresAt).getTime() < Date.now()) {
      user.resetOtpHash = null;
      user.resetOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP or expired OTP.' });
    }

    const incomingHash = hashOtp(String(otp));
    if (incomingHash !== user.resetOtpHash) {
      return res.status(400).json({ message: 'Invalid OTP or expired OTP.' });
    }

    user.password = newPassword;
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = {
  login,
  register,
  requestPasswordReset,
  resetPasswordWithOtp,
};
