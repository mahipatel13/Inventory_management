import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const ActiveIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await strengthService.listActiveIssues();
      setIssues(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onReturn = async (id) => {
    if (!window.confirm('Mark as returned?')) return;
    try {
      await strengthService.returnHardware(id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Return failed');
    }
  };

  const onEdit = async (it) => {
    try {
      const newDue = window.prompt('Update Due Date (yyyy-mm-dd)', (it.dueDate || '').slice(0, 10));
      if (!newDue) return; // cancelled
      const newRemarks = window.prompt('Update Remarks', it.remarks || '');
      await strengthService.updateIssue(it._id, { dueDate: newDue, remarks: newRemarks });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Update failed');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this issue record? Item availability will be restored if not returned.')) return;
    try {
      await strengthService.deleteIssue(id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <section className="active-issues">
      <h2>Active Hardware Issues</h2>
      {loading && <p>Loading…</p>}
      {!loading && issues.length === 0 && <p>No active issues.</p>}
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
              <th>Remarks</th>
              <th>Actions</th>
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
                <td>{it.remarks || '-'}</td>
                <td>
                  <button onClick={() => onReturn(it._id)}>Mark Returned</button>
                  <button onClick={() => onEdit(it)}>Edit</button>
                  <button onClick={() => onDelete(it._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default ActiveIssues;
