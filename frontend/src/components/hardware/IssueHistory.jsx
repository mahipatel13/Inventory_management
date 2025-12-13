import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const IssueHistory = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await strengthService.listIssueHistory({});
      setIssues(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load: show all history
    load();
  }, []);

  return (
    <section className="issue-history">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Issue History</h2>
        <button type="button" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && issues.length === 0 && <p>No history records.</p>}
      {!loading && issues.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Hardware</th>
              <th>Student</th>
              <th>Student ID</th>
              <th>Issued Date</th>
              <th>Due Date</th>
              <th>Returned</th>
              <th>Remarks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((it) => (
              <tr key={it._id}>
                <td>{it.hardware?.name}</td>
                <td>{it.studentName}</td>
                <td>{it.studentId}</td>
                <td>{it.issueDate ? new Date(it.issueDate).toLocaleDateString() : '-'}</td>
                <td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
                <td>{it.returnDate ? new Date(it.returnDate).toLocaleDateString() : '-'}</td>
                <td>{it.remarks || '-'}</td>
                <td>{it.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default IssueHistory;
