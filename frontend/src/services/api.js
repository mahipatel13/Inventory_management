import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  // increase timeout to accommodate slower local/back-end responses
  timeout: 30000,
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Prefer the session token (current login), fall back to localStorage for older sessions.
    const token = sessionStorage.getItem('aiml_token') || localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  const { token } = response.data;

  // Store token in both localStorage and sessionStorage for backward compatibility
  localStorage.setItem('token', token);
  sessionStorage.setItem('aiml_token', token);

  // Set the default authorization header
  apiClient.defaults.headers.common['x-auth-token'] = token;

  return response;
};

const fetchDailySummary = (semesterCode) => {
  if (semesterCode) return apiClient.get(`/strength/summary/daily?semester=${semesterCode}`);
  return apiClient.get('/strength/summary/daily');
};

const submitStrength = (payload) => apiClient.post('/strength', payload);

const fetchReport = (params, config = {}) => apiClient.get('/reports', { params, ...config });
const fetchReportExport = (params, config = {}) => apiClient.get('/reports/export', { params, ...config });
// Save report on server (will return filename)
const fetchSaveReport = (params, config = {}) => apiClient.get('/reports/save', { params, ...config });
// Download a previously saved report (returns blob)
const fetchDownloadSavedReport = (params, config = {}) => apiClient.get('/reports/download', { params, responseType: 'blob', ...config });

const fetchRevokes = () => apiClient.get('/strength/revokes');
const deleteStrength = (id) => apiClient.delete(`/strength/${id}`);
// Fallback for older summary payloads that don't include _id
// meta can be { createdAt } OR a composite set of fields (see backend controller)
const deleteStrengthByMeta = (meta) => apiClient.delete('/strength', { params: meta });

// Hardware inventory
const hardwareList = () => apiClient.get('/hardware');
const hardwareCreate = (data) => apiClient.post('/hardware', data);
const hardwareUpdate = (id, data) => apiClient.put(`/hardware/${id}`, data);
const hardwareDelete = (id) => apiClient.delete(`/hardware/${id}`);

// Hardware issues
const issueHardware = (data) => apiClient.post('/hardware/issues', data);
const returnHardware = (issueId) => apiClient.post(`/hardware/issues/${issueId}/return`);
const listActiveIssues = () => apiClient.get('/hardware/issues/active');
const listIssueHistory = (params = {}) => apiClient.get('/hardware/issues/history', { params });
const listDueToday = () => apiClient.get('/hardware/issues/due-today');
const updateIssue = (issueId, data) => apiClient.put(`/hardware/issues/${issueId}`, data);
const deleteIssue = (issueId) => apiClient.delete(`/hardware/issues/${issueId}`);

export default {
  login,
  fetchDailySummary,
  submitStrength,
  fetchReport,
  fetchReportExport,
  fetchSaveReport,
  fetchDownloadSavedReport,
  fetchRevokes,
  hardwareList,
  hardwareCreate,
  hardwareUpdate,
  hardwareDelete,
  issueHardware,
  returnHardware,
  listActiveIssues,
  listIssueHistory,
  listDueToday,
  updateIssue,
  deleteIssue,
  deleteStrength,
  deleteStrengthByMeta,
};
