'use strict';

const dayjs = require('dayjs');
const Strength = require('../models/Strength');
const excelGenerator = require('../utils/excelGenerator');
const fs = require('fs');
const path = require('path');

const buildDateRange = (rangeType, startDate, endDate) => {
  if (startDate && endDate) {
    return {
      start: dayjs(startDate).startOf('day'),
      end: dayjs(endDate).endOf('day'),
    };
  }

  const now = dayjs();

  switch (rangeType) {
    case 'weekly':
      return { start: now.startOf('week'), end: now.endOf('week') };
    case 'monthly':
      return { start: now.startOf('month'), end: now.endOf('month') };
    case 'daily':
    default:
      return { start: now.startOf('day'), end: now.endOf('day') };
  }
};

const fetchReport = async (req, res) => {
  try {
  const { semester, subject, startDate, endDate, rangeType, format } = req.query;
  const excelHeader = (req.headers['x-export-format'] || '').toString().toLowerCase();
  const acceptHeader = (req.headers.accept || '').toString().toLowerCase();

    // For Excel exports, always use the provided date range
    const { start, end } = format === 'excel' && startDate && endDate
      ? { start: dayjs(startDate), end: dayjs(endDate) }
      : buildDateRange(rangeType, startDate, endDate);

    const query = {
      date: {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
    };

    if (semester) query.semester = semester;
    if (subject) query['subject.code'] = subject;

    const entries = await Strength.find(query).sort({ date: -1, slot: 1 });

    const data = entries.map((entry) => ({
      date: dayjs(entry.date).format('YYYY-MM-DD'),
      semester: entry.semester,
      subject: entry.subject.name,
      faculty: entry.faculty,
      slot: entry.slot,
      room: entry.room.name,
      type: entry.room.type,
      strength: entry.studentStrength,
      revokeReason: entry.revoke?.isRevoked ? entry.revoke.reason : null,
      day: entry.day || '',
      createdAt: dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    }));

    // If the client requested Excel (via query param or header), generate and return the XLSX buffer
    if (format === 'excel' || excelHeader === 'excel' || acceptHeader.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      try {
        const buffer = await excelGenerator.generateExcel(data, 'Report');
        res.setHeader('Content-Disposition', `attachment; filename="aiml-report_${semester || 'all'}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(Buffer.from(buffer));
      } catch (err) {
        console.error('Failed to generate Excel', err);
        return res.status(500).json({ message: 'Unable to generate Excel report.' });
      }
    }

    return res.json({ data });
  } catch (error) {
    console.error('Fetch report error', error);
    return res.status(500).json({ message: 'Unable to fetch report.' });
  }
};

const exportWeeklyReport = async (req, res) => {
  try {
    const { semester } = req.query;
    req.query.rangeType = 'weekly';
    const reportResponse = await fetchReport(req, {
      json: (payload) => payload,
      status: () => ({ json: (payload) => payload }),
    });

  const weeklyData = reportResponse.data;
  const buffer = await excelGenerator.generateExcel(weeklyData, 'Weekly Report');

  res.setHeader('Content-Disposition', 'attachment; filename="aiml-weekly-report.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Weekly export error', error);
    return res.status(500).json({ message: 'Unable to export weekly report.' });
  }
};

const exportMonthlyReport = async (req, res) => {
  try {
    req.query.rangeType = 'monthly';
    const reportResponse = await fetchReport(req, {
      json: (payload) => payload,
      status: () => ({ json: (payload) => payload }),
    });

  const monthlyData = reportResponse.data;
  const buffer = await excelGenerator.generateExcel(monthlyData, 'Monthly Report');

  res.setHeader('Content-Disposition', 'attachment; filename="aiml-monthly-report.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Monthly export error', error);
    return res.status(500).json({ message: 'Unable to export monthly report.' });
  }
};

// New: export using explicit export endpoint (avoids content-negotiation pitfalls)
const exportReport = async (req, res) => {
  try {
    const { semester, subject, startDate, endDate, rangeType } = req.query;
    console.log('Export report called', { semester, subject, startDate, endDate, rangeType });
    console.log('Auth header present?', !!req.headers.authorization);
    // Use provided date range when available, fallback to buildDateRange
    const { start, end } = startDate && endDate
      ? { start: dayjs(startDate).startOf('day'), end: dayjs(endDate).endOf('day') }
      : buildDateRange(rangeType, startDate, endDate);

    const query = {
      date: {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
    };
    if (semester) query.semester = semester;
    if (subject) query['subject.code'] = subject;

    const entries = await Strength.find(query).sort({ createdAt: -1 });

    const data = entries.map((entry) => ({
      date: dayjs(entry.date).format('YYYY-MM-DD'),
      semester: entry.semester,
      subject: entry.subject.name,
      faculty: entry.faculty,
      slot: entry.slot,
      room: entry.room.name,
      type: entry.room.type,
      strength: entry.studentStrength,
      revokeReason: entry.revoke?.isRevoked ? entry.revoke.reason : null,
      day: entry.day || '',
      createdAt: dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    }));

  const buffer = await excelGenerator.generateExcel(data, 'Report');

  // Log helpful debug info
  console.log(`Exporting report: rows=${data.length} bufferBytes=${(buffer && buffer.byteLength) || (buffer && buffer.length) || 0}`);

  res.setHeader('Content-Disposition', `attachment; filename="aiml-report_${semester || 'all'}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export report error', error);
    return res.status(500).json({ message: 'Unable to export report.' });
  }
};

// Save generated report to server filesystem and return filename
const saveReport = async (req, res) => {
  try {
    const { semester, subject, startDate, endDate, rangeType } = req.query;

    const { start, end } = startDate && endDate
      ? { start: dayjs(startDate).startOf('day'), end: dayjs(endDate).endOf('day') }
      : buildDateRange(rangeType, startDate, endDate);

    const query = {
      date: {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
    };
    if (semester) query.semester = semester;
    if (subject) query['subject.code'] = subject;

    const entries = await Strength.find(query).sort({ createdAt: -1 });

    const data = entries.map((entry) => ({
      date: dayjs(entry.date).format('YYYY-MM-DD'),
      semester: entry.semester,
      subject: entry.subject.name,
      faculty: entry.faculty,
      slot: entry.slot,
      room: entry.room.name,
      type: entry.room.type,
      strength: entry.studentStrength,
      revokeReason: entry.revoke?.isRevoked ? entry.revoke.reason : null,
      day: entry.day || '',
      createdAt: dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    }));

    const buffer = await excelGenerator.generateExcel(data, 'Report');

    // ensure exports directory exists
    const exportsDir = path.join(__dirname, '..', 'data', 'exports');
    fs.mkdirSync(exportsDir, { recursive: true });

    const startStr = startDate ? dayjs(startDate).format('YYYY-MM-DD') : dayjs(start).format('YYYY-MM-DD');
    const endStr = endDate ? dayjs(endDate).format('YYYY-MM-DD') : dayjs(end).format('YYYY-MM-DD');
    const semStr = semester || 'all';
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');
    const filename = `aiml-report_${semStr}_${startStr}_to_${endStr}_${timestamp}.xlsx`;
    const filePath = path.join(exportsDir, filename);

    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    return res.json({ message: 'Report saved', filename });
  } catch (error) {
    console.error('Save report error', error);
    return res.status(500).json({ message: 'Unable to save report.' });
  }
};

// Download a previously saved report by filename
const downloadSavedReport = async (req, res) => {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).json({ message: 'File query param required.' });

    const exportsDir = path.join(__dirname, '..', 'data', 'exports');
    const safeName = path.basename(file); // prevent path traversal
    const filePath = path.join(exportsDir, safeName);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found.' });

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Download saved report error', error);
    return res.status(500).json({ message: 'Unable to download report.' });
  }
};

module.exports = {
  fetchReport,
  exportWeeklyReport,
  exportMonthlyReport,
  exportReport,
  saveReport,
  downloadSavedReport,
};
