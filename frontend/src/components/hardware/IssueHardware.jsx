import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const IssueHardware = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hardwareId: '',
    hardwareCode: '',
    studentId: '',
    studentName: '',
    contact: '',
    department: '',
    semester: '',
    period: '',
    issueDate: new Date().toISOString().slice(0, 10),
    // Default due date to 7 days from today so the submit button isn't blocked by an empty date
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    remarks: '',
  });

  const [otherMode, setOtherMode] = useState(false);
  const [other, setOther] = useState({ name: '', code: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await strengthService.hardwareList();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
        setItems(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onHardwareChange = (e) => {
    const v = e.target.value;
    if (v === 'other') {
      setForm((f) => ({ ...f, hardwareId: '', hardwareCode: '' }));
      setOtherMode(true);
    } else if (v.startsWith('id:')) {
      setForm((f) => ({ ...f, hardwareId: v.slice(3), hardwareCode: '' }));
      setOtherMode(false);
    } else if (v.startsWith('code:')) {
      setForm((f) => ({ ...f, hardwareId: '', hardwareCode: v.slice(5) }));
      setOtherMode(false);
    } else {
      setForm((f) => ({ ...f, hardwareId: '', hardwareCode: '' }));
      setOtherMode(false);
    }
  };

  const commonNameByCode = {
    RPI: 'Raspberry Pi',
    'HDMI-CBL': 'HDMI Cable',
    'CARD-READER': 'Card Reader',
    SCANNER: 'Scanner',
    'USB-CABLE': 'USB Cable',
    'ARD-UNO': 'Arduino Uno',
  };

  const createHardware = async ({ name, code }) => {
    const created = await strengthService.hardwareCreate({
      name,
      code,
      totalCount: 1,
      availableCount: 1,
      remarks: '',
    });
    const newId = created?.data?.data?._id || created?.data?._id;
    if (!newId) throw new Error('Failed to create hardware');
    return newId;
  };

  const createIfOther = async () => {
    if (!otherMode) return form.hardwareId;
    const name = other.name.trim();
    const code = other.code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-');
    if (!name || !code) throw new Error('Please enter name and code for Other');
    return createHardware({ name, code });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (!otherMode && !form.hardwareId && !form.hardwareCode) {
        alert('Please select a hardware item.');
        return;
      }
      if (!form.studentId || !form.studentName) {
        alert('Please enter Student ID and Student Name.');
        return;
      }
      if (!form.dueDate) {
        alert('Please select a Due Date.');
        return;
      }

      const hardwareId = await createIfOther();

      const payload = {
        studentId: form.studentId.trim(),
        studentName: form.studentName.trim(),
        contact: (form.contact || '').trim(),
        department: (form.department || '').trim(),
        semester: (form.semester || '').trim(),
        period: (form.period || '').trim(),
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        remarks: (form.remarks || '').trim(),
      };

      if (otherMode) {
        payload.hardwareId = hardwareId;
      } else if (form.hardwareId) {
        payload.hardwareId = form.hardwareId;
      } else if (form.hardwareCode) {
        const code = String(form.hardwareCode).trim().toUpperCase();
        const existing = items.find((it) => String(it?.code || '').toUpperCase() === code);
        if (existing?._id) {
          payload.hardwareId = existing._id;
        } else {
          // If user selected a common item that doesn't exist in inventory, auto-create it.
          const name = commonNameByCode[code] || code;
          payload.hardwareId = await createHardware({ name, code });
        }
      }

      // Debug: confirm identifiers present during testing
      // eslint-disable-next-line no-console
      console.log('Issuing payload', payload);
      await strengthService.issueHardware(payload);
      alert('Issued successfully');

      setForm({
        hardwareId: '',
        hardwareCode: '',
        studentId: '',
        studentName: '',
        contact: '',
        department: '',
        semester: '',
        period: '',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        remarks: '',
      });
      setOtherMode(false);
      setOther({ name: '', code: '' });

      // refresh items to reflect stock
      try {
        const res = await strengthService.hardwareList();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setItems(list.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {}
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Issue failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="issue-hardware">
      <h2>Issue Hardware</h2>
      {loading && <p>Loading…</p>}
      <form onSubmit={onSubmit}>
        <div>
          <label>Hardware</label>
          <select name="hardware" value={otherMode ? 'other' : (form.hardwareId ? `id:${form.hardwareId}` : form.hardwareCode ? `code:${form.hardwareCode}` : '')} onChange={onHardwareChange} required>
            <option value="">Select hardware</option>
            <optgroup label="Common Items">
              <option value="code:RPI">Raspberry Pi (RPI)</option>
              <option value="code:HDMI-CBL">HDMI Cable (HDMI-CBL)</option>
              <option value="code:CARD-READER">Card Reader (CARD-READER)</option>
              <option value="code:SCANNER">Scanner (SCANNER)</option>
              <option value="code:USB-CABLE">USB Cable (USB-CABLE)</option>
              <option value="code:ARD-UNO">Arduino Uno (ARD-UNO)</option>
            </optgroup>
            <option value="other">Other (enter name & code)</option>
          </select>
        </div>

        {otherMode && (
          <div className="other-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Other Name</label>
              <input name="otherName" value={other.name} onChange={(e) => setOther((o) => ({ ...o, name: e.target.value }))} required />
            </div>
            <div>
              <label>Other Code</label>
              <input name="otherCode" value={other.code} onChange={(e) => setOther((o) => ({ ...o, code: e.target.value }))} required />
            </div>
          </div>
        )}

        <div>
          <label>Student ID</label>
          <input name="studentId" value={form.studentId} onChange={onChange} required />
        </div>
        <div>
          <label>Student Name</label>
          <input name="studentName" value={form.studentName} onChange={onChange} required />
        </div>
        <div>
          <label>Contact</label>
          <input name="contact" value={form.contact} onChange={onChange} />
        </div>
        <div>
          <label>Department</label>
          <select name="department" value={form.department} onChange={onChange}>
            <option value="">Select department</option>
            <option value="AIML">AIML</option>
            <option value="IT">IT</option>
            <option value="CE">CE</option>
            <option value="CSE">CSE</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label>Semester</label>
          <select name="semester" value={form.semester} onChange={onChange}>
            <option value="">Select semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div>
          <label>Period / Time Slot</label>
          <input name="period" value={form.period} onChange={onChange} placeholder="e.g., 10:30–11:30 or P3" />
        </div>
        <div>
          <label>Issue Date</label>
          <input type="date" name="issueDate" value={form.issueDate} onChange={onChange} />
        </div>
        <div>
          <label>Due Date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} required />
        </div>
        <div>
          <label>Remarks</label>
          <input name="remarks" value={form.remarks} onChange={onChange} />
        </div>

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Issuing…' : 'Issue'}
        </button>
      </form>
    </section>
  );
};

export default IssueHardware;
