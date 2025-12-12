import React from 'react';
import './Navbar.css';

const Navbar = ({ onNavigate, currentView, onLogout }) => (
  <nav className="navbar">
    <div className="navbar-brand">AIML Strength Manager</div>
    <div className="navbar-links">
      <button
        className={currentView === 'dashboard' ? 'active' : ''}
        onClick={() => onNavigate('dashboard')}
      >
        Dashboard
      </button>
      <button
        className={currentView === 'reports' ? 'active' : ''}
        onClick={() => onNavigate('reports')}
      >
        Reports
      </button>
      <button
        className={currentView === 'timetable' ? 'active' : ''}
        onClick={() => onNavigate('timetable')}
      >
        Timetable
      </button>
      <button
        className={currentView === 'hardware' ? 'active' : ''}
        onClick={() => onNavigate('hardware')}
      >
        Inventory
      </button>
      <button
        className={currentView === 'hardware/issue' ? 'active' : ''}
        onClick={() => onNavigate('hardware/issue')}
      >
        Issue
      </button>
      <button
        className={currentView === 'hardware/active' ? 'active' : ''}
        onClick={() => onNavigate('hardware/active')}
      >
        Active
      </button>
      <button
        className={currentView === 'hardware/due-today' ? 'active' : ''}
        onClick={() => onNavigate('hardware/due-today')}
      >
        Due Today
      </button>
      <button
        className={currentView === 'hardware/history' ? 'active' : ''}
        onClick={() => onNavigate('hardware/history')}
      >
        History
      </button>
    </div>
    <button className="logout" onClick={onLogout}>
      Logout
    </button>
  </nav>
);

export default Navbar;
