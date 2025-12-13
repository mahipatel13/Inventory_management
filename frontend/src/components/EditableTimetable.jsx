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
  if (!cell || typeof cell !== 'object') return { subject: '', faculty: '', room: '', type: '' };
  return {
    subject: cell.subject || '',
    faculty: cell.faculty || '',
    room: cell.room || '',
    type: cell.type || '',
  };
};

const TYPE_OPTIONS = ['', 'LECTURE', 'LAB', 'TUTORIAL', 'PRACTICAL', 'ACTIVITY', 'SESSION'];

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
                        <input
                          type="text"
                          value={cell.subject}
                          onChange={(e) => onChangeCell(rowIndex, d.key, 'subject', e.target.value)}
                          placeholder="Subject"
                          style={{ width: '100%', marginBottom: 4 }}
                        />
                        <input
                          type="text"
                          value={cell.room}
                          onChange={(e) => onChangeCell(rowIndex, d.key, 'room', e.target.value)}
                          placeholder="Room"
                          style={{ width: '100%', marginBottom: 4 }}
                        />
                        <input
                          type="text"
                          value={cell.faculty}
                          onChange={(e) => onChangeCell(rowIndex, d.key, 'faculty', e.target.value)}
                          placeholder="Faculty"
                          style={{ width: '100%', marginBottom: 4 }}
                        />
                        <select
                          value={cell.type}
                          onChange={(e) => onChangeCell(rowIndex, d.key, 'type', e.target.value)}
                          style={{ width: '100%' }}
                        >
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t || 'empty'} value={t}>
                              {t || 'Type'}
                            </option>
                          ))}
                        </select>
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
