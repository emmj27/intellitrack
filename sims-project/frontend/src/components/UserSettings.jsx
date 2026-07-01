import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './UserSettings.css';
import { useModal } from './ModalProvider';

function UserSettings({ onClose }) {
  const { showAlert } = useModal();
  const [user, setUser] = useState(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  // Real-time password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user);
    });
  }, []);

  useEffect(() => {
    if (!newPassword) {
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
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

  const isValidPassword = Object.values(validations).every(Boolean);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      showAlert('Please fill in both password fields.');
      return;
    }

    if (!isValidPassword) {
      showAlert('Password does not meet the safety requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Passwords do not match.');
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    setIsUpdating(false);

    if (error) {
      showAlert(error.message);
    } else {
      showAlert('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  const getValidationClass = (isValid) => {
    if (isValid) return 'settings-validation-item valid';
    if (touchedPassword) return 'settings-validation-item invalid';
    return 'settings-validation-item';
  };

  const EyeIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <div className="modal-overlay">
      <div className="modal user-settings-modal">
        <div className="modal-header">
          <h3>User Settings</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        {user && (
          <div className="settings-section">
            <h4>Account Information</h4>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID:</span>
              <span className="info-value user-id-value">{user.id}</span>
            </div>
          </div>
        )}

        <div className="settings-section">
          <h4>Change Password</h4>
          <form onSubmit={handleUpdatePassword} className="settings-form">
            <div className="form-group full-width">
              <label>New Password</label>
              <div className="settings-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setTouchedPassword(true)}
                  placeholder="Enter new password"
                  className="settings-input"
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="settings-password-toggle"
                  tabIndex="-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              
              <div className="settings-validation-list">
                <div className={getValidationClass(validations.minLength)}>
                  <span className="settings-validation-icon">✓</span>
                  <span>At least 8 characters long</span>
                </div>
                <div className={getValidationClass(validations.hasUpper)}>
                  <span className="settings-validation-icon">✓</span>
                  <span>At least one uppercase letter</span>
                </div>
                <div className={getValidationClass(validations.hasLower)}>
                  <span className="settings-validation-icon">✓</span>
                  <span>At least one lowercase letter</span>
                </div>
                <div className={getValidationClass(validations.hasNumber)}>
                  <span className="settings-validation-icon">✓</span>
                  <span>At least one number (0-9)</span>
                </div>
                <div className={getValidationClass(validations.hasSpecial)}>
                  <span className="settings-validation-icon">✓</span>
                  <span>At least one special character</span>
                </div>
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '16px' }}>
              <label>Confirm Password</label>
              <div className="settings-input-wrapper">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="settings-input"
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="settings-password-toggle"
                  tabIndex="-1"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isUpdating}>Cancel</button>
              <button type="submit" className="btn-save" disabled={isUpdating || (!isValidPassword && newPassword.length > 0)}>
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserSettings;
