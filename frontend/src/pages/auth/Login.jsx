import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff, Shield, Users, User, Check } from 'lucide-react';
import ErrorMessage from '../../components/common/ErrorMessage';

export const Login = () => {
  const { login } = useAuth();
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
      // Backend FastAPI determines and verifies the actual user role
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
        backgroundColor: '#F5F6F8',
        padding: '1.5rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAECF0',
          boxShadow: '0 8px 24px rgba(16, 24, 40, 0.06)',
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20242D', margin: 0, letterSpacing: '-0.02em' }}>
            Revora
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#87909E', marginTop: '4px' }}>
            Subscription & Python Course Management
          </p>
        </div>

        {/* Role Selector Tabs (3 Roles) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Select Account Role
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              backgroundColor: '#F3F4F6',
              padding: '4px',
              borderRadius: '8px',
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
                backgroundColor: selectedRole === 'ADMIN' ? '#FFFFFF' : 'transparent',
                color: selectedRole === 'ADMIN' ? '#7952CC' : '#6B7280',
                boxShadow: selectedRole === 'ADMIN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
                backgroundColor: selectedRole === 'STAFF' ? '#FFFFFF' : 'transparent',
                color: selectedRole === 'STAFF' ? '#7952CC' : '#6B7280',
                boxShadow: selectedRole === 'STAFF' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
                backgroundColor: selectedRole === 'CUSTOMER' ? '#FFFFFF' : 'transparent',
                color: selectedRole === 'CUSTOMER' ? '#7952CC' : '#6B7280',
                boxShadow: selectedRole === 'CUSTOMER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
            <label className="form-label" style={{ fontWeight: 500, color: '#374151', fontSize: '0.8125rem' }}>
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
              style={{
                padding: '0.6rem 0.85rem',
                fontSize: '0.875rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
              }}
            />
          </div>

          {/* Password with Show/Hide Toggle */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: 500, color: '#374151', fontSize: '0.8125rem' }}>
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
                style={{
                  padding: '0.6rem 2.5rem 0.6rem 0.85rem',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  width: '100%',
                }}
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
                  color: '#9CA3AF',
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
                color: '#4B5563',
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
              style={{ color: '#7952CC', fontWeight: 500, textDecoration: 'none' }}
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
              backgroundColor: '#7952CC',
              color: '#FFFFFF',
              padding: '0.65rem 1rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 2px 6px rgba(121, 82, 204, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
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
            borderTop: '1px solid #EAECF0',
            fontSize: '0.8125rem',
          }}
        >
          <span style={{ color: '#87909E' }}>New student or enterprise customer? </span>
          <Link to="/register" style={{ fontWeight: 600, color: '#7952CC', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
