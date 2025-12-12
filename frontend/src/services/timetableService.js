import api from './api';

export const getTimetableBySemester = async (semester) => {
  try {
    const response = await api.get(`/api/timetable/semester/${semester}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllTimetables = async () => {
  try {
    const response = await api.get('/api/timetable');
    return response.data;
  } catch (error) {
    throw error;
  }
};