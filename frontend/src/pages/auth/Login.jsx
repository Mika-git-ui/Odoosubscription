import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogIn, Eye, EyeOff, Shield, Users, User, Sun, Moon } from 'lucide-react';
import ErrorMessage from '../../components/common/ErrorMessage';
import SpotlightCard from '../../components/common/SpotlightCard';

export const Login = () => {
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Role selection tabs matching prompt requirements
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [email, setEmail] = useState('admin@revora.io');
  const [password, setPassword] = useState('Admin@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSessionExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleRoleTabClick = (role) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('admin@revora.io');
      setPassword('Admin@1234');
    } else if (role === 'STAFF') {
      setEmail('staff@revora.io');
      setPassword('Staff@1234');
    } else {
      setEmail('student@example.com');
      setPassword('Student@1234');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const actualRole = (result.user?.role || selectedRole).toUpperCase();
      if (actualRole === 'CUSTOMER') {
        navigate('/my-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '1.5rem',
        position: 'relative',
        transition: 'background-color 150ms ease',
      }}
    >
      {/* Top Corner Quick Theme Switch */}
      <button
        type="button"
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-main)',
          padding: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <SpotlightCard
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
        }}
      >
        {/* Revora Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7952CC 0%, #9F7AEA 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 12px rgba(121, 82, 204, 0.3)',
            }}
          >
            R
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Revora
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Subscription & Python Course Management
          </p>
        </div>

        {/* Role Selector Tabs (3 Roles) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Select Account Role
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              backgroundColor: 'var(--bg-surface-alt)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleTabClick('ADMIN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: selectedRole === 'ADMIN' ? 600 : 500,
                backgroundColor: selectedRole === 'ADMIN' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: selectedRole === 'ADMIN' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              <Shield size={13} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabClick('STAFF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: selectedRole === 'STAFF' ? 600 : 500,
                backgroundColor: selectedRole === 'STAFF' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRole === 'STAFF' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: selectedRole === 'STAFF' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              <Users size={13} />
              <span>Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabClick('CUSTOMER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0.5rem 0.25rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: selectedRole === 'CUSTOMER' ? 600 : 500,
                backgroundColor: selectedRole === 'CUSTOMER' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRole === 'CUSTOMER' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: selectedRole === 'CUSTOMER' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              <User size={13} />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {isSessionExpired && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage
              title="Session Expired"
              message="Your session has expired. Please sign in again."
            />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage title="Authentication Notice" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@revora.io"
              required
              autoComplete="email"
            />
          </div>

          {/* Password with Show/Hide Toggle */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#7952CC', cursor: 'pointer' }}
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}`}</span>
          </button>
        </form>

        {/* Footer info */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-default)',
            fontSize: '0.8125rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>New student or enterprise customer? </span>
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </SpotlightCard>
    </div>
  );
};

export default Login;
