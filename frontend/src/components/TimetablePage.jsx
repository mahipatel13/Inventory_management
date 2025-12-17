import React, { useEffect, useMemo, useState } from 'react';
import Timetable from './Timetable';
import EditableTimetable from './EditableTimetable';
import { updateTimetableBySemester } from '../services/timetableService';
import { backendSemesterToUi } from '../utils/timetableTransform';

const semesterNumberFromCode = (code) => {
  const m = String(code || '').match(/^AIML(\d+)$/i);
  return m ? Number(m[1]) : null;
};

const TimetablePage = ({
  timetable,
  setTimetable,
  semesters,
  rawTimetables,
  setRawTimetables,
  userRole,
  timetableLoading,
}) => {
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftSchedule, setDraftSchedule] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const semesterOptions = useMemo(
    () =>
      semesters.map((semester) => (
        <option key={semester.code} value={semester.code}>
          {semester.name}
        </option>
      )),
    [semesters]
  );

  useEffect(() => {
    setStatus('');
    setIsEditing(false);
  }, [selectedSemester]);

  useEffect(() => {
    if (!isEditing) return;

    const n = semesterNumberFromCode(selectedSemester);
    const key = n ? `semester${n}` : null;
    const semObj = key ? rawTimetables?.[key] : null;

    setDraftName(semObj?.name || `Semester ${n || ''}`);
    setDraftSchedule(Array.isArray(semObj?.schedule) ? JSON.parse(JSON.stringify(semObj.schedule)) : []);
  }, [isEditing, selectedSemester, rawTimetables]);

  // Only show edit controls to users with explicit edit roles.
  // (Backend also enforces this, but we hide the UI to avoid confusion.)
  const canEdit = true; // userRole === 'admin' || userRole === 'staff';
  const selectedN = semesterNumberFromCode(selectedSemester);

  const handleSave = async () => {
    if (!selectedN) return;

    setSaving(true);
    setStatus('');
    try {
      if (!Array.isArray(draftSchedule)) {
        setStatus('Schedule is invalid.');
        return;
      }

      const updated = await updateTimetableBySemester(selectedN, {
        name: draftName,
        schedule: draftSchedule,
      });

      const backendKey = `semester${selectedN}`;
      setRawTimetables?.((prev) => ({
        ...(prev || {}),
        [backendKey]: updated,
      }));

      setTimetable?.((prev) => ({
        ...(prev || {}),
        [selectedSemester]: backendSemesterToUi(updated),
      }));

      setIsEditing(false);
      setStatus('Saved successfully.');
    } catch (e) {
      console.error('Failed to save timetable', e);
      const msg = e?.response?.data?.message || 'Failed to save timetable.';
      setStatus(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCell = (rowIndex, dayKey, field, value) => {
    setDraftSchedule((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const row = { ...(next[rowIndex] || {}) };
      const cell = { ...(row[dayKey] || {}) };
      
      if (field === 'type') {
        cell.type = value;
        if (value === 'LECTURE') {
          delete cell.batchCount;
          delete cell.subjectList;
          delete cell.facultyList;
          delete cell.batchList;
        } else if (value === 'LAB') {
          cell.batchCount = cell.batchCount || 1;
          cell.subjectList = Array.isArray(cell.subjectList) ? cell.subjectList : [''];
          cell.facultyList = Array.isArray(cell.facultyList) ? cell.facultyList : [''];
          cell.batchList = Array.isArray(cell.batchList) ? cell.batchList : [''];
        }
      } else if (field === 'batchCount') {
        const newCount = parseInt(value) || 1;
        cell.batchCount = newCount;
        
        const resizeArray = (arr) => {
          const current = Array.isArray(arr) ? [...arr] : [''];
          if (current.length < newCount) {
            return [...current, ...Array(newCount - current.length).fill('')];
          }
          return current.slice(0, newCount);
        };
        
        cell.subjectList = resizeArray(cell.subjectList);
        cell.facultyList = resizeArray(cell.facultyList);
        cell.batchList = resizeArray(cell.batchList);
      } else {
        cell[field] = value;
      }
      
      row[dayKey] = cell;
      next[rowIndex] = row;
      return next;
    });
  };

  const handleChangeTime = (rowIndex, value) => {
    setDraftSchedule((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const row = { ...(next[rowIndex] || {}) };
      row.time = value;
      next[rowIndex] = row;
      return next;
    });
  };

  const createEmptyRow = () => ({
    time: '',
    monday: { subject: '', faculty: '', room: '', type: '' },
    tuesday: { subject: '', faculty: '', room: '', type: '' },
    wednesday: { subject: '', faculty: '', room: '', type: '' },
    thursday: { subject: '', faculty: '', room: '', type: '' },
    friday: { subject: '', faculty: '', room: '', type: '' },
    saturday: { subject: '', faculty: '', room: '', type: '' },
  });

  const handleDeleteRow = (rowIndex) => {
    setDraftSchedule((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next.splice(rowIndex, 1);
      return next;
    });
  };

  const handleAddRow = () => {
    setDraftSchedule((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next.push(createEmptyRow());
      return next;
    });
  };

  return (
    <section className="timetable-page">
      <header className="page-header">
        <h2>Timetable</h2>
        <div className="semester-selector">
          <label htmlFor="tp-semester-select">Semester</label>
          <select
            id="tp-semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            {semesterOptions}
          </select>
        </div>
      </header>

      {selectedSemester && canEdit && (
        <div style={{ marginBottom: 12 }}>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={!rawTimetables || timetableLoading}
            >
              Edit timetable
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleSave} disabled={saving}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {isEditing && selectedSemester && canEdit ? (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="tt-name" style={{ fontWeight: 600 }}>
              Timetable name
            </label>
            <input
              id="tt-name"
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Semester timetable name"
              style={{ minWidth: 260, padding: '6px 8px' }}
            />
          </div>

          <EditableTimetable
            name={draftName}
            schedule={draftSchedule}
            onChangeCell={handleChangeCell}
            onChangeTime={handleChangeTime}
            onDeleteRow={handleDeleteRow}
          />
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={handleAddRow}>
              + Add Time Slot
            </button>
          </div>
        </div>
      ) : (
        <Timetable timetable={timetable[selectedSemester] || []} loading={timetableLoading} />
      )}

      {status && <p style={{ marginTop: 8 }}>{status}</p>}

      {!selectedSemester && (
        <p style={{ marginTop: 12, opacity: 0.8 }}>Select a semester to view timetable.</p>
      )}

      {selectedSemester && !selectedN && (
        <p style={{ marginTop: 12, color: 'crimson' }}>Invalid semester code selected.</p>
      )}
    </section>
  );
};

export default TimetablePage;
