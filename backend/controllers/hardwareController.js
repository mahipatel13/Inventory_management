'use strict';

const dayjs = require('dayjs');
const Hardware = require('../models/Hardware');
const HardwareIssue = require('../models/HardwareIssue');

// =====================
// List all hardware
// =====================
exports.listHardware = async (req, res) => {
  try {
    const hardware = await Hardware.find().sort({ createdAt: -1 });
    res.status(200).json({ data: hardware });
  } catch (error) {
    console.error('[hardwareController:listHardware]', error);
    res.status(500).json({ message: 'Unable to list hardware.' });
  }
};

// =====================
// Create new hardware
// =====================
exports.createHardware = async (req, res) => {
  try {
    const { name, code, totalCount, issuedCount, availableCount, remarks } = req.body;

    if (!name || !totalCount) {
      return res.status(400).json({ message: 'Missing required fields: name and totalCount.' });
    }

    const hw = await Hardware.create({
      name,
      code: code ? String(code).trim().toUpperCase() : undefined,
      totalCount: Number(totalCount),
      issuedCount: Number(issuedCount) || 0,
      availableCount: Number(availableCount) || (Number(totalCount) - (Number(issuedCount) || 0)),
      remarks: remarks || ''
    });

    return res.status(201).json({ message: 'Hardware created successfully.', data: hw });
  } catch (error) {
    console.error('[hardwareController:createHardware]', error);
    return res.status(500).json({ message: 'Unable to create hardware.' });
  }
};

// =====================
// Update hardware
// =====================
exports.updateHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, totalCount, issuedCount, availableCount, remarks } = req.body;

    if (!name || !totalCount) {
      return res.status(400).json({ message: 'Missing required fields: name and totalCount.' });
    }

    const updateData = {
      name,
      code: code ? String(code).trim().toUpperCase() : undefined,
      totalCount: Number(totalCount),
      issuedCount: Number(issuedCount) || 0,
      availableCount: Number(availableCount) || (Number(totalCount) - (Number(issuedCount) || 0)),
      remarks: remarks || ''
    };

    const hw = await Hardware.findByIdAndUpdate(id, updateData, { new: true });
    if (!hw) return res.status(404).json({ message: 'Hardware not found.' });
    
    res.status(200).json({ message: 'Hardware updated successfully.', data: hw });
  } catch (error) {
    console.error('[hardwareController:updateHardware]', error);
    res.status(500).json({ message: 'Unable to update hardware.' });
  }
};

// =====================
// Delete hardware
// =====================
exports.deleteHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const hw = await Hardware.findByIdAndDelete(id);
    if (!hw) return res.status(404).json({ message: 'Hardware not found.' });
    res.status(200).json({ message: 'Hardware deleted successfully.' });
  } catch (error) {
    console.error('[hardwareController:deleteHardware]', error);
    res.status(500).json({ message: 'Unable to delete hardware.' });
  }
};

// =====================
// Issue hardware ✅
// =====================
exports.issueHardware = async (req, res) => {
  try {
    const {
      hardwareId,
      hardwareCode,
      studentId,
      studentName,
      contact,
      department,
      semester,
      period,
      issueDate,
      dueDate,
      remarks
    } = req.body;

    // Validate required fields
    if ((!hardwareId && !hardwareCode) || !studentId || !studentName || !dueDate) {
      return res.status(400).json({
        message: 'Missing required fields: hardwareId or hardwareCode, studentId, studentName, and dueDate.'
      });
    }

    // Find hardware by ID or code
    let hw = null;
    if (hardwareId) {
      hw = await Hardware.findById(hardwareId);
    } else if (hardwareCode) {
      hw = await Hardware.findOne({ code: hardwareCode });
    }

    if (!hw) return res.status(404).json({ message: 'Hardware not found.' });
    if (hw.availableCount <= 0) return res.status(400).json({ message: 'No available units to issue.' });

    // Create hardware issue record
    const issue = await HardwareIssue.create({
      hardware: hw._id,
      studentId,
      studentName,
      contact: contact || '',
      department: department || '',
      semester: semester || '',
      period: period || '',
      issueDate: issueDate ? dayjs(issueDate).toDate() : new Date(),
      dueDate: dayjs(dueDate).toDate(),
      remarks: remarks || '',
      status: 'issued'
    });

    // Decrease available count
    hw.availableCount = Math.max(0, hw.availableCount - 1);
    await hw.save();

    return res.status(201).json({ message: 'Hardware issued successfully.', data: issue });
  } catch (error) {
    console.error('[hardwareController:issueHardware]', error);
    return res.status(500).json({ message: 'Unable to issue hardware.' });
  }
};

// =====================
// Return hardware
// =====================
exports.returnHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await HardwareIssue.findById(id).populate('hardware');
    if (!issue) return res.status(404).json({ message: 'Issue record not found.' });
    if (issue.status === 'returned') return res.status(400).json({ message: 'Hardware already returned.' });

    issue.status = 'returned';
    issue.returnDate = new Date();
    await issue.save();

    const hw = issue.hardware;
    hw.availableCount += 1;
    await hw.save();

    res.status(200).json({ message: 'Hardware returned successfully.', data: issue });
  } catch (error) {
    console.error('[hardwareController:returnHardware]', error);
    res.status(500).json({ message: 'Unable to return hardware.' });
  }
};

// =====================
// Active issues
// =====================
exports.listActiveIssues = async (req, res) => {
  try {
    const issues = await HardwareIssue.find({ status: 'issued' }).populate('hardware').sort({ issueDate: -1 });
    res.status(200).json({ data: issues });
  } catch (error) {
    console.error('[hardwareController:listActiveIssues]', error);
    res.status(500).json({ message: 'Unable to fetch active issues.' });
  }
};

// =====================
// Issue history
// =====================
exports.listIssueHistory = async (req, res) => {
  try {
    const issues = await HardwareIssue.find().populate('hardware').sort({ issueDate: -1 });
    res.status(200).json({ data: issues });
  } catch (error) {
    console.error('[hardwareController:listIssueHistory]', error);
    res.status(500).json({ message: 'Unable to fetch issue history.' });
  }
};

// =====================
// Due today
// =====================
exports.listDueToday = async (req, res) => {
  try {
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    const issues = await HardwareIssue.find({
      status: 'issued',
      dueDate: { $gte: today.toDate(), $lt: tomorrow.toDate() }
    }).populate('hardware');
    res.status(200).json({ data: issues });
  } catch (error) {
    console.error('[hardwareController:listDueToday]', error);
    res.status(500).json({ message: 'Unable to fetch due-today issues.' });
  }
};

// =====================
// Update issue details
// =====================
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await HardwareIssue.findByIdAndUpdate(id, req.body, { new: true });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.status(200).json({ message: 'Issue updated successfully.', data: issue });
  } catch (error) {
    console.error('[hardwareController:updateIssue]', error);
    res.status(500).json({ message: 'Unable to update issue.' });
  }
};

// =====================
// Delete issue record
// =====================
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await HardwareIssue.findByIdAndDelete(id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.status(200).json({ message: 'Issue deleted successfully.' });
  } catch (error) {
    console.error('[hardwareController:deleteIssue]', error);
    res.status(500).json({ message: 'Unable to delete issue.' });
  }
};
