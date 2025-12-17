const DAY_MAP = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const normalizeSlot = (time) => {
  if (!time) return '';
  // backend uses e.g. "09:10-10:10"; UI prefers "09:10 - 10:10"
  const t = String(time).trim();
  if (t.includes(' - ')) return t;
  // only replace the first dash between start/end times
  const parts = t.split('-').map((p) => p.trim());
  if (parts.length >= 2) return `${parts[0]} - ${parts.slice(1).join('-')}`;
  return t;
};

export const backendSemesterToUi = (semesterObj) => {
  const result = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  const schedule = semesterObj?.schedule;
  if (!Array.isArray(schedule)) return result;

  schedule.forEach((row) => {
    const slot = normalizeSlot(row?.time);
    Object.entries(DAY_MAP).forEach(([backendDay, uiDay]) => {
      const cell = row?.[backendDay] || {};
      const subject = cell.subject || '';
      // backend may or may not provide a separate code field; avoid duplicating the subject in the UI
      const subjectCode = cell.subjectCode || cell.code || cell.subject || '';

      // keep an entry even if empty (so the grid stays consistent)
      result[uiDay].push({
        slot,
        subject,
        subjectCode,
        faculty: cell.faculty || '',
        room: cell.room || '',
        type: cell.type || '',
        batchCount: cell.batchCount || 1,
        facultyList: Array.isArray(cell.facultyList) ? cell.facultyList : [cell.faculty || ''],
        batchList: Array.isArray(cell.batchList) ? cell.batchList : [cell.batch || ''],
      });
    });
  });

  return result;
};

export const backendAllTimetablesToUi = (allTimetables) => {
  const ui = {};
  for (let n = 1; n <= 8; n += 1) {
    const key = `semester${n}`;
    if (!allTimetables?.[key]) continue;
    ui[`AIML${n}`] = backendSemesterToUi(allTimetables[key]);
  }
  return ui;
};
