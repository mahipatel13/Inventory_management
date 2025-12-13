import { apiClient } from './api';

export const getTimetableBySemester = async (semester) => {
  const response = await apiClient.get(`/timetable/semester/${semester}`);
  return response.data;
};

export const getAllTimetables = async () => {
  const response = await apiClient.get('/timetable');
  return response.data;
};

export const updateTimetableBySemester = async (semester, payload) => {
  const response = await apiClient.put(`/timetable/semester/${semester}`, payload);
  return response.data;
};

export const copyTimetableFromSemester = async (targetSemester, sourceSemester) => {
  const response = await apiClient.post(`/timetable/semester/${targetSemester}/copy-from/${sourceSemester}`);
  return response.data;
};
