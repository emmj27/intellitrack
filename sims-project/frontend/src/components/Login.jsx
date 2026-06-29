// Login.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

function Login({ onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Login error:', err);
      // Give readable error descriptions
      if (err.message === 'Email not confirmed') {
        setError('Please check your inbox and verify your email address before logging in.');
      } else if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your IntelliTrack account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={loading}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password-input">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-password-toggle"
                tabIndex="-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? <div className="auth-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <span onClick={onNavigateToRegister} className="auth-link">
            Create Account
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
