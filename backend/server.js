'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDatabase = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const strengthRoutes = require('./routes/strengthRoutes');
const reportRoutes = require('./routes/reportRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const User = require('./models/User');
const Hardware = require('./models/Hardware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'AIML strength tracker backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/strength', strengthRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/hardware', hardwareRoutes);

const initializeDefaultUser = async () => {
  const defaultUsername = process.env.DEFAULT_USERNAME || 'aimladmin';
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'aimlpass123';

  const exists = await User.findOne({ username: defaultUsername });
  if (!exists) {
    await User.create({ username: defaultUsername, password: defaultPassword, role: 'admin' });
    console.log(`Default user created: ${defaultUsername}/${defaultPassword}`);
  }
};

const initializeDefaultHardware = async () => {
  const defaults = [
    { name: 'Raspberry Pi', code: 'RPI', category: 'Electronics', totalCount: 5, location: 'Lab', remarks: '' },
    { name: 'HDMI Cable', code: 'HDMI-CBL', category: 'Accessory', totalCount: 20, location: 'Lab', remarks: '' },
    { name: 'Card Reader', code: 'CARD-READER', category: 'Accessory', totalCount: 10, location: 'Lab', remarks: '' },
    { name: 'Scanner', code: 'SCANNER', category: 'Device', totalCount: 2, location: 'Office', remarks: '' },
    { name: 'USB Cable', code: 'USB-CABLE', category: 'Accessory', totalCount: 30, location: 'Lab', remarks: '' },
    { name: 'Arduino Uno', code: 'ARD-UNO', category: 'Electronics', totalCount: 8, location: 'Lab', remarks: '' },
  ];

  for (const item of defaults) {
    const exists = await Hardware.findOne({ code: item.code });
    if (!exists) {
      await Hardware.create({
        ...item,
        availableCount: item.totalCount,
      });
      console.log(`Seeded hardware: ${item.name} (${item.code})`);
    }
  }
};

const startServer = async () => {
  await connectDatabase();
  await initializeDefaultUser();
  await initializeDefaultHardware();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();