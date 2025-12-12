import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
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
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const timetable = useMemo(() => timetableData, []);
  const semesters = useMemo(() => semestersData, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Persist authentication based on stored token
    const token = sessionStorage.getItem('aiml_token') || localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = async (username, password) => {
    // return promise so caller can chain/navigation
    const res = await strengthService.login({ username, password });
    setIsAuthenticated(true);
    return res;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aiml_token');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
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
                <TimetablePage timetable={timetable} semesters={semesters} />
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
      <Footer />
    </div>
  );
};

export default App;