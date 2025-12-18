import React, { useEffect, useState } from 'react';
import strengthService from '../services/api';
import './Reports.css';

const Reports = ({ semesters }) => {
  const [filters, setFilters] = useState({
    semester: '',
    subject: '',
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const selectedSemester = semesters.find((sem) => sem.code === filters.semester);
    setSubjects(selectedSemester?.subjects || []);
  }, [filters.semester, semesters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchReport = async (rangeType) => {
    setLoading(true);
    try {
      const response = await strengthService.fetchReport({
        ...filters,
        rangeType,
      });
      setReportData(response.data || []);
    } catch (error) {
      console.error('Failed to load report data', error);
    } finally {
      setLoading(false);
    }
  };

  // Export all DB entries for selected date range to Excel
  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates for the export');
      return;
    }

    setLoading(true);
    try {
      // Format date range for filename
      const startDate = new Date(filters.startDate).toLocaleDateString('en-IN').replace(/\//g, '-');
      const endDate = new Date(filters.endDate).toLocaleDateString('en-IN').replace(/\//g, '-');
      const semesterStr = filters.semester
        ? semesters.find((s) => s.code === filters.semester)?.name || filters.semester
        : 'All-Semesters';
      const filename = `Strength_Report_${semesterStr}_${startDate}_to_${endDate}`;

      // Fetch Excel file from backend
      const response = await strengthService.fetchReportExport(
        {
          ...filters,
          rangeType: 'custom',
        },
        {
          responseType: 'blob',
        }
      );

      // If server returned an error JSON/html instead of XLSX, show a helpful message
      const blob = new Blob([response.data]);
      const contentType = blob.type || response.headers?.['content-type'] || '';
      const expectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (!contentType.includes('sheet') && !contentType.includes('excel') && !contentType.includes('application/octet-stream')) {
        // attempt to read text from blob and show as error
        const text = await blob.text();
        let msg = 'Failed to download report.';
        try {
          const parsed = JSON.parse(text);
          msg = parsed.message || JSON.stringify(parsed);
        } catch (e) {
          // not JSON - show raw text (could be HTML error page)
          msg = text.slice(0, 1000);
        }
        alert(`Server error while generating Excel: ${msg}`);
        return;
      }

      // Create and trigger download for valid XLSX blob
      const xlsxBlob = new Blob([response.data], { type: expectedMime });
      const url = window.URL.createObjectURL(xlsxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Failed to export Excel', error);

      // If axios returned a response (non-2xx), try to extract a useful message
      if (error && error.response) {
        try {
          const respData = error.response.data;
          // respData may be a Blob (if server returned a body) or JSON/text
          if (respData instanceof Blob) {
            const txt = await respData.text();
            let parsed;
            try {
              parsed = JSON.parse(txt);
            } catch (e) {
              parsed = null;
            }
            const msg = parsed?.message || txt.slice(0, 1000);
            alert(`Server error while generating report: ${msg}`);
          } else if (typeof respData === 'string') {
            // response as string
            let parsed;
            try {
              parsed = JSON.parse(respData);
            } catch (e) {
              parsed = null;
            }
            const msg = parsed?.message || respData.slice(0, 1000);
            alert(`Server error while generating report: ${msg}`);
          } else if (typeof respData === 'object') {
            alert(`Server error while generating report: ${respData.message || JSON.stringify(respData)}`);
          } else {
            alert('Failed to download report. Server returned an error.');
          }
        } catch (e) {
          console.error('Error reading error response', e);
          alert('Failed to download report. Please try again.');
        }
      } else {
        alert('Network error while downloading report. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reports">
      <header className="reports-header">
        <h2>Reports &amp; Analytics</h2>
      </header>

      <form className="report-form">
        <div className="form-group">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
          >
            <option value="">All Semesters</option>
            {semesters.map((semester) => (
              <option key={semester.code} value={semester.code}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>

        {/* <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
            disabled={!subjects.length}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.code} value={subject.code}>
                {subject.name}
              </option>
            ))}
          </select>
        </div> */}

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </form>

      <div className="report-actions">
        <button 
          type="button" 
          onClick={handleExport} 
          disabled={loading || (!filters.startDate && !filters.endDate)}
        >
          Export to Excel
        </button>
      </div>

      <div className="report-results">
        {loading && <p>Loading report data…</p>}
        {!loading && reportData.length === 0 && <p>No records found for the selected filters.</p>}
        {!loading && reportData.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Semester</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Slot</th>
                <th>Room/Lab</th>
                <th>Type</th>
                <th>Batch</th>
                <th>Strength</th>
                <th>Revoke</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((entry) => (
                <tr key={`${entry.date}-${entry.slot}-${entry.subject}-${entry.batchLetter || ''}`}>
                  <td>{entry.date}</td>
                  <td>{entry.semester}</td>
                  <td>{entry.subject}</td>
                  <td>{entry.faculty}</td>
                  <td>{entry.slot}{entry.type === 'Lab' ? ' (2 hours)' : ''}</td>
                  <td>{entry.room}</td>
                  <td>{entry.type}</td>
                  <td>{entry.batchLetter || '-'}</td>
                  <td>{entry.strength}</td>
                  <td>{entry.revokeReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Reports;