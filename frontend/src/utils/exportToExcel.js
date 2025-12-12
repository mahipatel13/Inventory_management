import * as XLSX from 'xlsx';

const exportToExcel = (data, filename) => {
  if (!data || !data.length) {
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export default exportToExcel;