<<<<<<< HEAD
// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aiml-secret');

    // Support both token payload shapes:
    // - { userId, username, role }
    // - legacy: { user: { id } }
    const userId = decoded?.userId || decoded?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
=======
'use strict';

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aiml-secret');
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('JWT verification failed', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
>>>>>>> d83b35838584bac70878df8ba16ba27ada70e4da
