import React, { useMemo } from 'react';
import './Timetable.css';

const dayOrder = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

const normalizeSlot = (time) => {
  if (!time) return '';
  const t = String(time).trim();
  if (t.includes(' - ')) return t;
  const parts = t.split('-').map((p) => p.trim());
  if (parts.length >= 2) return `${parts[0]} - ${parts.slice(1).join('-')}`;
  return t;
};

const ensureCell = (cell) => {
  if (!cell || typeof cell !== 'object') return { subject: '', faculty: '', room: '', type: '', batchCount: 1, subjectList: [''], facultyList: [''], batchList: [''] };
  const batchCount = cell.batchCount || 1;
  let subjectList = Array.isArray(cell.subjectList) ? [...cell.subjectList] : [cell.subject || ''];
  let facultyList = Array.isArray(cell.facultyList) ? [...cell.facultyList] : [cell.faculty || ''];
  let batchList = Array.isArray(cell.batchList) ? [...cell.batchList] : [cell.batch || ''];
  // Resize arrays to match batchCount
  if (subjectList.length < batchCount) {
    subjectList = [...subjectList, ...Array(batchCount - subjectList.length).fill('')];
  } else if (subjectList.length > batchCount) {
    subjectList = subjectList.slice(0, batchCount);
  }
  if (facultyList.length < batchCount) {
    facultyList = [...facultyList, ...Array(batchCount - facultyList.length).fill('')];
  } else if (facultyList.length > batchCount) {
    facultyList = facultyList.slice(0, batchCount);
  }
  if (batchList.length < batchCount) {
    batchList = [...batchList, ...Array(batchCount - batchList.length).fill('')];
  } else if (batchList.length > batchCount) {
    batchList = batchList.slice(0, batchCount);
  }
  return {
    type: cell.type || '',
    subject: cell.subject || '',
    faculty: cell.faculty || '',
    room: cell.room || '',
    batchCount,
    subjectList,
    facultyList,
    batchList,
  };
};

const TYPE_OPTIONS = ['LECTURE', 'LAB'];

const EditableTimetable = ({ name, schedule, onChangeCell, onChangeTime, onDeleteRow }) => {
  const rows = useMemo(() => (Array.isArray(schedule) ? schedule : []), [schedule]);

  return (
    <div className="timetable weekly-table">
      <h2>Semester Timetable</h2>
      <div className="table-responsive">
        <table className="week-table">
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Time</th>
              {dayOrder.map((d) => (
                <th key={d.key}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row?.time || rowIndex}>
                <td className="slot-cell">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={normalizeSlot(row?.time)}
                      onChange={(e) => onChangeTime?.(rowIndex, e.target.value)}
                      placeholder="09:10 - 10:10"
                      style={{ width: '100%', minWidth: 120 }}
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteRow?.(rowIndex)}
                      title="Delete this time row"
                      style={{ padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
                {dayOrder.map((d) => {
                  const cell = ensureCell(row?.[d.key]);
                  return (
                    <td key={`${d.key}-${rowIndex}`} className="day-cell">
                      <div className="cell-content">
                        <select
                          value={cell.type}
                          onChange={(e) => onChangeCell(rowIndex, d.key, 'type', e.target.value)}
                          style={{ width: '100%', marginBottom: 4 }}
                        >
                          <option value="">Select Type</option>
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {cell.type === 'LAB' ? (
                          <>
                            <label style={{ fontSize: '12px', marginBottom: 2 }}>Batch Count</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={cell.batchCount}
                              onChange={(e) => onChangeCell(rowIndex, d.key, 'batchCount', parseInt(e.target.value) || 1)}
                              placeholder="e.g., 4"
                              style={{ width: '100%', marginBottom: 4 }}
                            />
                            {Array.from({ length: cell.batchCount }, (_, i) => (
                              <div key={i}>
                                <label style={{ fontSize: '12px', marginBottom: 2 }}>Subject {String.fromCharCode(65 + i)}</label>
                                <input
                                  type="text"
                                  value={cell.subjectList[i] || ''}
                                  onChange={(e) => {
                                    const newSubjectList = [...cell.subjectList];
                                    newSubjectList[i] = e.target.value;
                                    onChangeCell(rowIndex, d.key, 'subjectList', newSubjectList);
                                  }}
                                  placeholder={`Subject for Batch ${String.fromCharCode(65 + i)}`}
                                  style={{ width: '100%', marginBottom: 4 }}
                                />
                                <label style={{ fontSize: '12px', marginBottom: 2 }}>Faculty {String.fromCharCode(65 + i)}</label>
                                <input
                                  type="text"
                                  value={cell.facultyList[i] || ''}
                                  onChange={(e) => {
                                    const newFacultyList = [...cell.facultyList];
                                    newFacultyList[i] = e.target.value;
                                    onChangeCell(rowIndex, d.key, 'facultyList', newFacultyList);
                                  }}
                                  placeholder={`Faculty for Batch ${String.fromCharCode(65 + i)}`}
                                  style={{ width: '100%', marginBottom: 4 }}
                                />
                                <label style={{ fontSize: '12px', marginBottom: 2 }}>Location {String.fromCharCode(65 + i)}</label>
                                <input
                                  type="text"
                                  value={cell.batchList[i] || ''}
                                  onChange={(e) => {
                                    const newBatchList = [...cell.batchList];
                                    newBatchList[i] = e.target.value;
                                    onChangeCell(rowIndex, d.key, 'batchList', newBatchList);
                                  }}
                                  placeholder={`Location for Batch ${String.fromCharCode(65 + i)}`}
                                  style={{ width: '100%', marginBottom: 4 }}
                                />
                              </div>
                            ))}
                            <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
                              Note: LAB sessions span 2 consecutive hours
                            </div>
                          </>
                        ) : cell.type === 'LECTURE' ? (
                          <>
                            <input
                              type="text"
                              value={cell.subject}
                              onChange={(e) => onChangeCell(rowIndex, d.key, 'subject', e.target.value)}
                              placeholder="Subject"
                              style={{ width: '100%', marginBottom: 4 }}
                            />
                            <input
                              type="text"
                              value={cell.faculty}
                              onChange={(e) => onChangeCell(rowIndex, d.key, 'faculty', e.target.value)}
                              placeholder="Faculty"
                              style={{ width: '100%', marginBottom: 4 }}
                            />
                            <input
                              type="text"
                              value={cell.room}
                              onChange={(e) => onChangeCell(rowIndex, d.key, 'room', e.target.value)}
                              placeholder="Room"
                              style={{ width: '100%', marginBottom: 4 }}
                            />
                          </>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {name ? null : null}
    </div>
  );
};

export default EditableTimetable;
