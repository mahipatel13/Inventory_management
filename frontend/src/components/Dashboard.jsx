import React, { useEffect, useState } from 'react';
import Timetable from './Timetable';
import EnterStrength from './EnterStrength';
import strengthService from '../services/api';
import './Dashboard.css';

const Dashboard = ({ timetable, semesters, onStrengthSubmit, onRefresh }) => {
  // default to empty to show entries from all semesters
  const [selectedSemester, setSelectedSemester] = useState('');
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      setDeleting(true);
      await strengthService.deleteStrength(id);

      // Refresh the entries after successful deletion
      if (onRefresh) {
        onRefresh();
      }

      const response = selectedSemester
        ? await strengthService.fetchDailySummary(selectedSemester)
        : await strengthService.fetchDailySummary();
      setDailySummary(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to delete entry', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = selectedSemester
          ? await strengthService.fetchDailySummary(selectedSemester)
          : await strengthService.fetchDailySummary();
        const summaryData = Array.isArray(response.data?.data) ? response.data.data : [];
        setDailySummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch daily summary', error);
        setDailySummary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedSemester, onRefresh]);

  const semesterOptions = semesters.map((semester) => (
    <option key={semester.code} value={semester.code}>
      {semester.name}
    </option>
  ));

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <h1>AIML Strength Dashboard</h1>
        <div className="semester-selector">
          <label htmlFor="semester-select">Semester</label>
          <select
            id="semester-select"
            value={selectedSemester}
            onChange={(event) => setSelectedSemester(event.target.value)}
          >
            <option value="">All Semesters</option>
            {semesterOptions}
          </select>
        </div>
      </header>

      <Timetable timetable={timetable[selectedSemester] || []} loading={loading} />

      <EnterStrength
        semesters={semesters}
        timetable={timetable}
        onSubmit={onStrengthSubmit}
        onRefresh={onRefresh}
      />

      <section className="daily-summary">
        <h2>All Strength Entries</h2>
        {loading && <p>Loading strength records…</p>}
        {!loading && dailySummary.length === 0 && <p>No entries recorded yet.</p>}
        <div className="summary-grid">
          {dailySummary.map((entry) => (
            <article className="summary-card" key={`${entry.createdAt}-${entry.slot}-${entry.subject}`}>
              <h3>{entry.subject}</h3>
              <p>
                <strong>Added:</strong> {entry.date} {entry.time}
              </p>
              <p>
                <strong>Day:</strong> {entry.day}
              </p>
              <p>
                <strong>Faculty:</strong> {entry.faculty}
              </p>
              <p>
                <strong>Slot:</strong> {entry.slot}
              </p>
              <p>
                <strong>Room:</strong> {entry.roomName} ({entry.roomType})
              </p>
              <p>
                <strong>Strength:</strong> {entry.studentStrength}
              </p>
              {entry.revoke && (
                <p className="revoke-tag">Revoke Reason: {entry.revoke.reason}</p>
              )}
              <button
                className="delete-btn"
                onClick={() => handleDelete(entry._id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Dashboard;