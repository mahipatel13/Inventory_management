import React from 'react';
import './Timetable.css';

const Timetable = ({ timetable, loading }) => {
  if (loading) {
    return <p className="timetable-loading">Loading timetable…</p>;
  }

  if (!timetable) {
    return <p className="timetable-empty">No timetable data available.</p>;
  }

  // If timetable is an array, render a single grid (backwards-compatible).
  const isArray = Array.isArray(timetable);

  const renderGrid = (entries) => {
    if (!entries || entries.length === 0) {
      return <p className="timetable-empty">No classes scheduled.</p>;
    }

    return (
      <div className="timetable-grid">
        <div className="timetable-header">Slot</div>
        <div className="timetable-header">Room/Lab</div>
        <div className="timetable-header">Type</div>

        {entries.map((entry, idx) => (
          <React.Fragment key={`${entry.slot}-${entry.subject || entry.subjectCode}-${idx}`}>
            <div className="timetable-cell">{entry.slot}</div>
            <div className="timetable-cell">{entry.room}</div>
            <div className="timetable-cell type-column">{entry.type}</div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // If it's array, render single section
  if (isArray) {
    return (
      <div className="timetable">
        <h2>Semester Timetable</h2>
        {renderGrid(timetable)}
      </div>
    );
  }

  // Otherwise assume object with day keys
  // Render a weekly table (Mon..Sat) with ordered time slots per row
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // build a master ordered slot list from the actual timetable data so we match exact slot strings
  const extractSlots = () => {
    const slots = new Set();
    Object.values(timetable).forEach((dayList) => {
      Array.isArray(dayList) && dayList.forEach((e) => e && e.slot && slots.add(e.slot));
    });
    return Array.from(slots);
  };

  const parseStartMinutes = (slot) => {
    // expects formats like '09:15 - 10:00' or '09:10 - 10:10'
    try {
      const start = slot.split('-')[0].trim();
      const [h, m] = start.split(':').map((s) => parseInt(s, 10));
      return h * 60 + (m || 0);
    } catch (e) {
      return 0;
    }
  };

  let slotOrder = extractSlots();
  const defaultSlots = [
    '09:10 - 10:10',
    '10:10 - 11:10',
    '11:10 - 12:10',
    '12:10 - 13:10',
    '13:10 - 14:10',
    '14:10 - 15:10',
    '15:10 - 16:10',
  ];
  slotOrder = Array.from(new Set([...defaultSlots, ...slotOrder]));
  slotOrder.sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  const findEntry = (day, slot) => {
    const list = timetable[day] || [];
    return list.find((e) => e.slot === slot) || null;
  };

  // Track cells that are spanned by LAB sessions
  const skippedCells = new Set();

  return (
    <div className="timetable weekly-table">
      <h2>Semester Timetable</h2>
      <div className="table-responsive">
        <table className="week-table">
          <thead>
            <tr>
              <th>Time</th>
              {dayOrder.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slotOrder.map((slot) => {
              if (slot.includes('11:10') && slot.includes('12:10')) {
                return (
                  <tr key={slot} className="break-row">
                    <td className="slot-cell">{slot}</td>
                    <td
                      colSpan={dayOrder.length}
                      className="break-cell"
                      style={{
                        backgroundColor: '#f9f9f9',
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic',
                        verticalAlign: 'middle',
                      }}
                    >
                      Break
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={slot}>
                  <td className="slot-cell">{slot}</td>
                  {dayOrder.map((day) => {
                    if (skippedCells.has(`${day}-${slot}`)) return null;
                    const entry = findEntry(day, slot);
                    let rowspan = 1;
                    if (entry && entry.type === 'LAB') {
                      const currentIndex = slotOrder.indexOf(slot);
                      if (currentIndex < slotOrder.length - 1) {
                        rowspan = 2;
                        skippedCells.add(`${day}-${slotOrder[currentIndex + 1]}`);
                      }
                    }
                    return (
                      <td key={`${day}-${slot}`} className="day-cell" rowSpan={rowspan}>
                        {entry ? (
                          // If entry has sections (A..E), render them inside the cell
                          entry.sections ? (
                            <div className="cell-sections">
                              {Object.keys(entry.sections).map((sec) => {
                                const s = entry.sections[sec];
                                return (
                                  <div className="section" key={sec}>
                                    <div className="section-name">{sec}</div>
                                    <div className="section-subject">{s.subject}</div>
                                    {s.room && <div className="section-room">{s.room}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : entry.subject ? (
                            <div className="cell-content">
                              {entry.type === 'LECTURE' ? (
                                <>
                                  <div className="cell-type">{entry.type}</div>
                                  <div className="cell-subject">{entry.subject}</div>
                                  {entry.faculty && <div className="cell-faculty">{entry.faculty}</div>}
                                  {entry.room && <div className="cell-room">{entry.room}</div>}
                                </>
                              ) : entry.type === 'LAB' ? (
                                <>
                                  <div className="cell-type">{entry.type}</div>
                                  {Array.from({ length: entry.batchCount || 1 }, (_, i) => {
                                    const batchLetter = String.fromCharCode(65 + i);
                                    const subject = Array.isArray(entry.subjectList) ? entry.subjectList[i] : '';
                                    const faculty = Array.isArray(entry.facultyList) ? entry.facultyList[i] : '';
                                    const location = Array.isArray(entry.batchList) ? entry.batchList[i] : '';
                                    return (
                                      <div key={i} className="cell-batch">
                                        <strong>Batch {batchLetter}</strong><br />
                                        {subject && <span>Subject: {subject}<br /></span>}
                                        {faculty && <span>Faculty: {faculty}<br /></span>}
                                        {location && <span>Location: {location}</span>}
                                      </div>
                                    );
                                  })}
                                </>
                              ) : (
                                <>
                                  <div className="cell-subject">{entry.subject}</div>
                                  {entry.room && <div className="cell-room">{entry.room}</div>}
                                  {entry.faculty && <div className="cell-faculty">{entry.faculty}</div>}
                                  {entry.type && <div className="cell-type">{entry.type}</div>}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="cell-empty">&nbsp;</div>
                          )
                        ) : (
                          <div className="cell-empty">&nbsp;</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;