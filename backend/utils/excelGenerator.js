'use strict';

const ExcelJS = require('exceljs');

const generateExcel = (records, sheetName = 'Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Semester', key: 'semester', width: 12 },
    { header: 'Subject', key: 'subject', width: 22 },
    { header: 'Faculty', key: 'faculty', width: 20 },
    { header: 'Slot', key: 'slot', width: 18 },
    { header: 'Room/Lab', key: 'room', width: 15 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Student Strength', key: 'strength', width: 18 },
    { header: 'Revoke Reason', key: 'revokeReason', width: 30 },
  ];

  records.forEach((record) => {
    worksheet.addRow(record);
  });

  worksheet.getRow(1).font = { bold: true };

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  generateExcel,
};