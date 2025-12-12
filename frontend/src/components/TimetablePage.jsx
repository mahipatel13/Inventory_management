import React, { useState } from 'react';
import Timetable from './Timetable';

const TimetablePage = ({ timetable, semesters }) => {
  const [selectedSemester, setSelectedSemester] = useState('');

  const semesterOptions = semesters.map((semester) => (
    <option key={semester.code} value={semester.code}>
      {semester.name}
    </option>
  ));

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

      <Timetable timetable={timetable[selectedSemester] || []} loading={false} />
    </section>
  );
};

export default TimetablePage;
