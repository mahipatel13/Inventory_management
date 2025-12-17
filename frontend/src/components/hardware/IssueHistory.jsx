import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const IssueHistory = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

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

  const deleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    setDeleting(issueId);
    try {
      await strengthService.deleteIssue(issueId);
      setIssues(issues.filter(it => it._id !== issueId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete issue.');
    } finally {
      setDeleting(null);
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
              <th>contact number</th>
              <th>Issued Date</th>
              <th>Due Date</th>
              <th>Returned</th>
              <th>Remarks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((it) => (
              <tr key={it._id}>
                <td>{it.hardware?.name}</td>
                <td>{it.studentName}</td>
                <td>{it.studentId}</td>
                <td>{it.contact}</td>
                <td>{it.issueDate ? new Date(it.issueDate).toLocaleDateString() : '-'}</td>
                <td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
                <td>{it.returnDate ? new Date(it.returnDate).toLocaleDateString() : '-'}</td>
                <td>{it.remarks || '-'}</td>
                <td>{it.status}</td>
                <td>
                  <button
                    onClick={() => deleteIssue(it._id)}
                    disabled={deleting === it._id}
                    style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    {deleting === it._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default IssueHistory;
