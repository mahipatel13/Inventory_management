import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
      await onLogin(username, password);
      // After successful login, redirect to where user wanted to go or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>AIML Department Login</h2>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => {
            setError('');
            setUsername(e.target.value);
          }}
          placeholder="Enter username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setError('');
            setPassword(e.target.value);
          }}
          placeholder="Enter password"
        />

        {error && <p className="error" role="alert">{error}</p>}

        <div className="button-row">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/forgot-password');
            }}
            className="forgot-link"
          >
            Forgot password?
          </a>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;