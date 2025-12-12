import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const DueToday = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await strengthService.listDueToday();
      setIssues(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="due-today">
      <h2>Due Today</h2>
      {loading && <p>Loading…</p>}
      {!loading && issues.length === 0 && <p>No submissions due today.</p>}
      {!loading && issues.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Hardware</th>
              <th>Code</th>
              <th>Student</th>
              <th>Student ID</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((it) => (
              <tr key={it._id}>
                <td>{it.hardware?.name}</td>
                <td>{it.hardware?.code}</td>
                <td>{it.studentName}</td>
                <td>{it.studentId}</td>
                <td>{it.issueDate ? new Date(it.issueDate).toLocaleDateString() : '-'}</td>
                <td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
                <td>{it.period || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default DueToday;
