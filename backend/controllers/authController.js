'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });

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

module.exports = {
  login,
};