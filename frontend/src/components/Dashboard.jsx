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
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, entry) => {
    const fallbackCreatedAt = entry?.createdAt;

    const metaFallback = fallbackCreatedAt
      ? { createdAt: fallbackCreatedAt }
      : {
          date: entry?.date,
          semester: entry?.semester,
          slot: entry?.slot,
          subject: entry?.subject,
          faculty: entry?.faculty,
          roomName: entry?.roomName,
          roomType: entry?.roomType,
          studentStrength: entry?.studentStrength,
        };

    // If we don't have an id, we still try the meta fallback.
    if (!id && (!metaFallback?.createdAt && !metaFallback?.date)) {
      alert('This entry cannot be deleted (missing id). Please refresh and try again.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    const previousEntries = dailySummary;

    try {
      setDeletingId(id || fallbackCreatedAt || entry?.date);

      // Optimistic UI: remove from list immediately.
      setDailySummary((prev) => prev.filter((e) => {
        const eid = e._id || e.id;
        if (id) return eid !== id;
        return e.createdAt !== fallbackCreatedAt;
      }));

      try {
        if (id) {
          await strengthService.deleteStrength(id);
        } else {
          await strengthService.deleteStrengthByMeta(metaFallback);
        }
      } catch (primaryError) {
        // If id-based delete fails (e.g., backend missing the /:id route), try meta fallback.
        const status = primaryError?.response?.status;
        const canTryMeta = !id ? false : !!(metaFallback?.createdAt || metaFallback?.date);

        if (status === 404 && canTryMeta) {
          await strengthService.deleteStrengthByMeta(metaFallback);
        } else {
          throw primaryError;
        }
      }

      // Refresh the entries after successful deletion (keeps UI and DB in sync)
      const response = selectedSemester
        ? await strengthService.fetchDailySummary(selectedSemester)
        : await strengthService.fetchDailySummary();
      setDailySummary(Array.isArray(response.data?.data) ? response.data.data : []);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete entry', error);

      // Roll back optimistic update
      setDailySummary(previousEntries);

      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to delete entry (${status || 'no status'}): ${message}`);
    } finally {
      setDeletingId(null);
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

  const semesterLabel = (semesterCode) => {
    if (!semesterCode) return '-';
    return semesters.find((s) => s.code === semesterCode)?.name || semesterCode;
  };

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
          {dailySummary.map((entry) => {
            const entryId = entry._id || entry.id;
            return (
            <article className="summary-card" key={entryId || `${entry.createdAt}-${entry.slot}-${entry.subject}`}>
              <div className="summary-card-top">
                <span
                  className={
                    selectedSemester && entry.semester === selectedSemester
                      ? 'semester-badge semester-badge--active'
                      : 'semester-badge'
                  }
                >
                  {semesterLabel(entry.semester)}
                </span>
              </div>
              <h3>{entry.subject}{entry.batchLetter ? ` - Batch ${entry.batchLetter}` : ''}</h3>
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
                <strong>Slot:</strong> {entry.slot}{entry.roomType === 'Lab' ? ' (2 hours)' : ''}
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
                onClick={() => handleDelete(entryId, entry)}
                disabled={deletingId === (entryId || entry.createdAt)}
              >
                {deletingId === (entryId || entry.createdAt) ? 'Deleting...' : 'Delete'}
              </button>
            </article>
            );
          })}
        </div>
      </section>
    </section>
  );
};

export default Dashboard;