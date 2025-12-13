import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import strengthService from '../services/api';
import './Login.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await strengthService.requestPasswordReset({ email: email.trim() });
      setMessage(res?.data?.message || 'OTP sent.');
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp || !newPassword || !confirmPassword) {
      setError('OTP and new password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await strengthService.resetPasswordWithOtp({
        email: email.trim(),
        otp,
        newPassword,
      });
      setMessage(res?.data?.message || 'Password updated successfully.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={step === 1 ? requestOtp : resetPassword}>
        <h2>Forgot Password</h2>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setError('');
            setEmail(e.target.value);
          }}
          placeholder="Enter email"
          disabled={step === 2 || loading}
        />

        {step === 2 && (
          <>
            <label htmlFor="otp">OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => {
                setError('');
                setOtp(e.target.value);
              }}
              placeholder="Enter OTP"
              disabled={loading}
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setError('');
                setNewPassword(e.target.value);
              }}
              placeholder="Enter new password"
              disabled={loading}
            />

            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setError('');
                setConfirmPassword(e.target.value);
              }}
              placeholder="Confirm new password"
              disabled={loading}
            />
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="success">{message}</p>}

        {step === 1 ? (
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        ) : (
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        )}

        <p>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="forgot-link">Back to login</a>
        </p>

        {step === 2 && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setError('');
              setMessage('');
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setStep(1);
            }}
            disabled={loading}
          >
            Change email / resend OTP
          </button>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;