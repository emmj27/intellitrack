// CreateAcc.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css'; // Reuses page structure
import './CreateAcc.css'; // Add-on styles for validations

function CreateAcc({ onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Real-time password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const [touchedPassword, setTouchedPassword] = useState(false);

  useEffect(() => {
    if (!password) {
      setValidations({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      });
      return;
    }

    setValidations({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isValidPassword = Object.values(validations).every(Boolean);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isValidPassword) {
      setError('Password does not meet the safety requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Supabase Sign Up triggers email verification if configured in dashboard
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  const getValidationClass = (isValid) => {
    if (isValid) return 'auth-validation-item valid';
    if (touchedPassword) return 'auth-validation-item invalid';
    return 'auth-validation-item';
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-success-card">
          <div className="auth-success-icon">✉</div>
          <h2 className="auth-success-title">Verify Your Email</h2>
          <p className="auth-success-message">
            We have sent a verification link to <span className="auth-success-email">{email}</span>. Please click the link to activate your account.
          </p>
          <button onClick={onNavigateToLogin} className="auth-submit-btn">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join IntelliTrack Smart Inventory Management</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email-input">Email Address</label>
            <input
              id="register-email-input"
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
            <label className="auth-label" htmlFor="register-password-input">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setTouchedPassword(true)}
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

            {/* Real-time Requirement List */}
            <div className="auth-validation-list">
              <div className={getValidationClass(validations.minLength)}>
                <span className="auth-validation-icon">✓</span>
                <span>At least 8 characters long</span>
              </div>
              <div className={getValidationClass(validations.hasUpper)}>
                <span className="auth-validation-icon">✓</span>
                <span>At least one uppercase letter</span>
              </div>
              <div className={getValidationClass(validations.hasLower)}>
                <span className="auth-validation-icon">✓</span>
                <span>At least one lowercase letter</span>
              </div>
              <div className={getValidationClass(validations.hasNumber)}>
                <span className="auth-validation-icon">✓</span>
                <span>At least one number (0-9)</span>
              </div>
              <div className={getValidationClass(validations.hasSpecial)}>
                <span className="auth-validation-icon">✓</span>
                <span>At least one special character</span>
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password-input">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="auth-password-toggle"
                tabIndex="-1"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !isValidPassword}
          >
            {loading ? <div className="auth-spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <span onClick={onNavigateToLogin} className="auth-link">
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}

export default CreateAcc;
