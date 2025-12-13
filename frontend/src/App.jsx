import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HardwareInventory from './components/hardware/HardwareInventory';
import IssueHardware from './components/hardware/IssueHardware';
import ActiveIssues from './components/hardware/ActiveIssues';
import DueToday from './components/hardware/DueToday';
import IssueHistory from './components/hardware/IssueHistory';
import TimetablePage from './components/TimetablePage';
import Revoke from './components/Revoke';
import timetableData from './data/timetable';
import semestersData from './data/semesters';
import strengthService from './services/api';
import { getAllTimetables } from './services/timetableService';
import { backendAllTimetablesToUi } from './utils/timetableTransform';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(
    sessionStorage.getItem('aiml_role') || localStorage.getItem('aiml_role') || ''
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // UI timetable shape used across Dashboard/EnterStrength/Timetable components
  const [timetable, setTimetable] = useState(timetableData);
  // Raw backend shape (time rows + day cells) used for editing
  const [rawTimetables, setRawTimetables] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);

  const semesters = useMemo(() => semestersData, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Persist authentication based on stored token
    const token = sessionStorage.getItem('aiml_token') || localStorage.getItem('token');
    const role = sessionStorage.getItem('aiml_role') || localStorage.getItem('aiml_role') || '';
    if (token) setIsAuthenticated(true);
    if (role) setUserRole(role);
  }, []);

  useEffect(() => {
    // After login (token present), prefer backend timetables so admins can edit without code changes.
    const loadTimetables = async () => {
      if (!isAuthenticated) return;

      setTimetableLoading(true);
      try {
        const all = await getAllTimetables();
        setRawTimetables(all);
        const ui = backendAllTimetablesToUi(all);
        if (Object.keys(ui).length > 0) {
          setTimetable((prev) => ({ ...prev, ...ui }));
        }
      } catch (e) {
        // Keep local fallback timetableData
        console.error('Failed to load timetables from backend; using local fallback.', e);
      } finally {
        setTimetableLoading(false);
      }
    };

    loadTimetables();
  }, [isAuthenticated]);

  const handleLogin = async (username, password) => {
    // return promise so caller can chain/navigation
    const res = await strengthService.login({ username, password });
    const role = res?.data?.role || '';
    if (role) {
      // Store in both sessionStorage and localStorage so role-based UI (like timetable editing)
      // works even after a hard refresh.
      sessionStorage.setItem('aiml_role', role);
      localStorage.setItem('aiml_role', role);
      setUserRole(role);
    }
    setIsAuthenticated(true);
    return res;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aiml_token');
    sessionStorage.removeItem('aiml_role');
    localStorage.removeItem('token');
    localStorage.removeItem('aiml_role');
    setIsAuthenticated(false);
    setUserRole('');
    // go to login screen
    navigate('/login');
  };

  const handleStrengthSubmit = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
  };

  return (
    <div className="app">
      {/* Navbar shown only when authenticated */}
      {isAuthenticated && <Navbar onNavigate={(v) => navigate(`/${v}`)} currentView={location.pathname.replace('/', '') || 'dashboard'} onLogout={handleLogout} />}

      <main>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard
                  timetable={timetable}
                  semesters={semesters}
                  onStrengthSubmit={handleStrengthSubmit}
                  onRefresh={refreshKey}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports semesters={semesters} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetablePage
                  timetable={timetable}
                  setTimetable={setTimetable}
                  semesters={semesters}
                  rawTimetables={rawTimetables}
                  setRawTimetables={setRawTimetables}
                  userRole={userRole}
                  timetableLoading={timetableLoading}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revoke"
            element={
              <ProtectedRoute>
                <Revoke />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware"
            element={
              <ProtectedRoute>
                <HardwareInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware/issue"
            element={
              <ProtectedRoute>
                <IssueHardware />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware/active"
            element={
              <ProtectedRoute>
                <ActiveIssues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware/due-today"
            element={
              <ProtectedRoute>
                <DueToday />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware/history"
            element={
              <ProtectedRoute>
                <IssueHistory />
              </ProtectedRoute>
            }
          />
          {/* default route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
      {location.pathname !== '/login' && location.pathname !== '/forgot-password' && <Footer />}
    </div>
  );
};

export default App;