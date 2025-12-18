import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import strengthService from '../services/api';
import './Login.css';

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const { username, email, password, confirmPassword } = form;

    if (!username || !email || !password) {
      setError('Username, email, and password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one capital letter.');
      return;
    }

    if (email && !email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@charusat.ac.in')) {
      setError('Email must be a Gmail (@gmail.com) or Charusat (@charusat.ac.in) address.');
      return;
    }

    try {
      setLoading(true);
      const res = await strengthService.register({ username, email, password });
      setMessage(res?.data?.message || 'Registration successful. Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={form.username}
          onChange={onChange}
          placeholder="Enter username"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Enter password"
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="Confirm password"
          required
        />

        {error && <p className="error" role="alert">{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p>
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login</a>
        </p>
      </form>
    </div>
  );
};

export default Register;