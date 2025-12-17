import React, { useMemo, useState } from 'react';
import strengthService from '../services/api';
import './EnterStrength.css';

const initialForm = {
  semester: '',
  date: '',
  day: '',
  subject: '',
  // slotKey is the <select> value (includes day to keep it unique across days)
  slotKey: '',
  // slot is the actual slot time string that we store/submit (e.g. "09:10 - 10:10")
  slot: '',
  room: '',
  type: '',
  faculty: '',
  studentStrength: '',
  revoke: false,
  revokeReason: '',
  batch: '',
  selectedSlotData: null,
};

const EnterStrength = ({ semesters, timetable, onSubmit, onRefresh }) => {
  const [formState, setFormState] = useState(initialForm);
  const [status, setStatus] = useState('');

  const availableSlots = useMemo(() => {
    if (!formState.semester) return [];
    const semesterData = timetable[formState.semester];
    if (!semesterData) return [];

    // support older array shape (flat list of slots)
    if (Array.isArray(semesterData)) return semesterData.map(s => ({ ...s, _day: undefined }));

    // try exact key and also a capitalized day key for robustness
    const pickDay = (dayKey) => semesterData[dayKey] || semesterData[dayKey?.toLowerCase()] || semesterData[dayKey?.charAt(0).toUpperCase() + dayKey?.slice(1)];

    if (formState.day) {
      // if a specific day chosen, return that day's slots and attach the day for disambiguation
      const daySlots = pickDay(formState.day) || [];
      return (daySlots || []).map((s) => ({ ...s, _day: formState.day }));
    }

    // if no day selected, flatten all days into a single list but keep _day to show where each slot belongs
    const flattened = [];
    Object.keys(semesterData).forEach((day) => {
      const slots = semesterData[day] || [];
      slots.forEach((s) => flattened.push({ ...s, _day: day }));
    });
    return flattened;
  }, [formState.semester, formState.day, timetable]);

  const filteredSubjects = useMemo(() => {
    const selectedSemester = semesters.find((sem) => sem.code === formState.semester);
    return selectedSemester?.subjects || [];
  }, [formState.semester, semesters]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatus('');

    setFormState((prev) => {
      const nextValue = type === 'checkbox' ? checked : value;
      const next = { ...prev, [name]: nextValue };

      // If the timetable scope changes, the previously selected slot may not exist anymore.
      // Reset the slot-related fields so the <select> always reflects the user's choice.
      if (name === 'semester' || name === 'day') {
        return {
          ...next,
          slotKey: '',
          slot: '',
          subject: '',
          room: '',
          type: '',
          faculty: '',
        };
      }

      return next;
    });
  };

  const handleSlotSelect = (event) => {
    const slotValue = event.target.value;
    // slotValue format: "Day||slot" or "||slot" (when flat list without day)
    const parts = slotValue.split('||');
    const dayPart = parts[0] ? parts[0] : undefined;
    const slotPart = parts[1] || parts[0] || '';

    const slotDetails = availableSlots.find((slot) => {
      const sameSlot = slot.slot === slotPart;
      if (dayPart) return sameSlot && slot._day === dayPart;
      return sameSlot;
    });

    const normalizeType = (t) => {
      if (!t) return '';
      const lower = t.toString().toLowerCase();
      if (lower.includes('lab')) return 'Lab';
      if (lower.includes('lecture')) return 'Lecture';
      if (lower.includes('break')) return 'Other';
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    };

    setFormState((prev) => ({
      ...prev,
      // slotKey must match an <option value> so the selected item stays visible
      slotKey: slotValue,
      // slot is what we store/submit
      slot: slotPart,
      day: dayPart || prev.day,
      subject: slotDetails?.subjectCode || slotDetails?.subject || prev.subject,
      room: slotDetails?.room || prev.room,
      type: normalizeType(slotDetails?.type) || prev.type,
      faculty: slotDetails?.faculty || prev.faculty,
      batch: '',
      selectedSlotData: slotDetails,
    }));
  };

  const handleBatchSelect = (event) => {
    const batchIndex = parseInt(event.target.value);
    const slotData = formState.selectedSlotData;
    
    if (slotData && slotData.subjectList && slotData.facultyList && slotData.batchList) {
      setFormState((prev) => ({
        ...prev,
        batch: event.target.value,
        subject: slotData.subjectList[batchIndex] || prev.subject,
        faculty: slotData.facultyList[batchIndex] || prev.faculty,
        room: slotData.batchList[batchIndex] || prev.room,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = sessionStorage.getItem('aiml_token') || localStorage.getItem('token');
      if (!token) {
        setStatus('You are not logged in. Please log in and try again.');
        return;
      }

      const selectedSubject = filteredSubjects.find(sub => sub.code === formState.subject);
      // Do not send UI-only fields like slotKey to the backend.
      const { slotKey: _slotKey, ...formWithoutUiFields } = formState;
      const payload = {
        ...formWithoutUiFields,
        studentStrength: Number(formState.studentStrength),
        subjectName: selectedSubject?.name || formState.subject,
        date: formState.date || new Date().toISOString(),
        // include day (if chosen) so backend can store it
        day: formState.day || undefined,
      };

      console.log('Submitting payload:', payload);

      if (Number.isNaN(payload.studentStrength) || payload.studentStrength < 0) {
        setStatus('Please enter a valid strength value.');
        return;
      }

      const response = await strengthService.submitStrength(payload);
      console.log('Server response:', response);
      
      setStatus('Strength entry saved successfully!');
      setFormState(initialForm);
      onSubmit?.();
      onRefresh?.();
    } catch (error) {
      // detect timeout
      console.error('Failed to submit strength entry', error);
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        setStatus('Request timed out. Server may be slow or unavailable — please try again.');
      } else if (error?.response) {
        // server responded with non-2xx
        const msg = error.response.data?.message || JSON.stringify(error.response.data) || 'Server error. Please try again.';
        setStatus(msg);
      } else {
        setStatus('Network error — unable to reach server. Check backend is running.');
      }
    }
  };

  return (
    <section className="enter-strength">
      <h2>Enter Student Strength</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            name="semester"
            value={formState.semester}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select semester
            </option>
            {semesters.map((semester) => (
              <option key={semester.code} value={semester.code}>
                {semester.name}
              </option>
            ))}
          </select>

          <label htmlFor="day">Day</label>
          <select id="day" name="day" value={formState.day} onChange={handleChange}>
            <option value="">All days</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>

          <label htmlFor="slot">Slot</label>
          <select id="slot" name="slot" value={formState.slotKey} onChange={handleSlotSelect} required>
            <option value="" disabled>
              Select slot
            </option>
            {availableSlots.map((slot) => {
              // create a unique value combining day and slot to avoid collisions across days
              const value = slot._day ? `${slot._day}||${slot.slot}` : `||${slot.slot}`;
              const labelDay = slot._day ? `${slot._day} — ` : '';
              const labelSub = slot.subject || (slot.sections ? 'Sections' : '');
              return (
                <option key={value} value={value}>
                  {labelDay}{slot.slot} — {labelSub}
                </option>
              );
            })}
          </select>

          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={formState.date}
            onChange={handleChange}
            placeholder="Select date"
          />

          {formState.type === 'Lab' && formState.selectedSlotData?.batchCount > 0 && (
            <>
              <label htmlFor="batch">Batch</label>
              <select
                id="batch"
                name="batch"
                value={formState.batch}
                onChange={handleBatchSelect}
                required
              >
                <option value="" disabled>
                  Select batch
                </option>
                {Array.from({ length: formState.selectedSlotData.batchCount }, (_, i) => {
                  const batchLetter = String.fromCharCode(65 + i);
                  const subject = formState.selectedSlotData.subjectList?.[i] || '';
                  const faculty = formState.selectedSlotData.facultyList?.[i] || '';
                  const location = formState.selectedSlotData.batchList?.[i] || '';
                  return (
                    <option key={i} value={i}>
                      Batch {batchLetter} - {subject} ({faculty}) @ {location}
                    </option>
                  );
                })}
              </select>
            </>
          )}

          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            value={formState.subject}
            onChange={handleChange}
            list="subject-list"
            placeholder="Subject"
            required
            readOnly={formState.type === 'Lab' && formState.batch !== ''}
          />
          <datalist id="subject-list">
            {filteredSubjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name}
              </option>
            ))}
          </datalist>

          <label htmlFor="room">Room/Lab</label>
          <input
            id="room"
            name="room"
            value={formState.room}
            onChange={handleChange}
            placeholder="Room or lab"
            required
            readOnly={formState.type === 'Lab' && formState.batch !== ''}
          />

          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={formState.type} onChange={handleChange} required>
            <option value="" disabled>
              Select type
            </option>
            <option value="Lecture">Lecture</option>
            <option value="Lab">Lab</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="faculty">Faculty</label>
          <input
            id="faculty"
            name="faculty"
            value={formState.faculty}
            onChange={handleChange}
            placeholder="Faculty name"
            required
            readOnly={formState.type === 'Lab' && formState.batch !== ''}
          />

          <label htmlFor="studentStrength">Student Strength</label>
          <input
            id="studentStrength"
            name="studentStrength"
            type="number"
            value={formState.studentStrength}
            onChange={handleChange}
            placeholder="Enter count"
            min="0"
            required
          />
        </div>

        <div className="revoke-section">
          <label htmlFor="revoke">
            <input
              id="revoke"
              name="revoke"
              type="checkbox"
              checked={formState.revoke}
              onChange={handleChange}
            />
            Revoke (mass bunk/event)
          </label>

          {formState.revoke && (
            <textarea
              name="revokeReason"
              value={formState.revokeReason}
              onChange={handleChange}
              placeholder="Provide reason for revoke"
              required
            />
          )}
        </div>

        <button type="submit">Save Entry</button>
      </form>
      {status && <p className="status-message">{status}</p>}
    </section>
  );
};

export default EnterStrength;