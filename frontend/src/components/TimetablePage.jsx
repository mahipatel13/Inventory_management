import React, { useEffect, useMemo, useState } from 'react';
import Timetable from './Timetable';
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
  const [draftScheduleJson, setDraftScheduleJson] = useState('[]');
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
    setDraftScheduleJson(JSON.stringify(semObj?.schedule || [], null, 2));
  }, [isEditing, selectedSemester, rawTimetables]);

  const canEdit = userRole === 'admin';
  const selectedN = semesterNumberFromCode(selectedSemester);

  const handleSave = async () => {
    if (!selectedN) return;

    setSaving(true);
    setStatus('');
    try {
      let schedule;
      try {
        schedule = JSON.parse(draftScheduleJson);
      } catch {
        setStatus('Invalid JSON in schedule. Please fix it and try again.');
        return;
      }

      if (!Array.isArray(schedule)) {
        setStatus('Schedule must be a JSON array.');
        return;
      }

      const updated = await updateTimetableBySemester(selectedN, {
        name: draftName,
        schedule,
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
              Edit timetable (admin)
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

      {isEditing && selectedSemester && canEdit && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <label>
              Name:
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                style={{ width: '100%', maxWidth: 600, marginLeft: 8 }}
              />
            </label>
          </div>

          <div>
            <label>
              Schedule JSON (editable):
              <textarea
                value={draftScheduleJson}
                onChange={(e) => setDraftScheduleJson(e.target.value)}
                rows={18}
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </label>
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
              Tip: each item should look like:{' '}
              <code>
                {'{"time":"09:10-10:10","monday":{"subject":"...","faculty":"...","room":"...","type":"LECTURE"}}'}
              </code>
            </p>
          </div>
        </div>
      )}

      {status && <p style={{ marginTop: 8 }}>{status}</p>}

      <Timetable timetable={timetable[selectedSemester] || []} loading={timetableLoading} />

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
