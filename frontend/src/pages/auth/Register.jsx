import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { validatePassword, isValidEmail } from '../../utils/validators';
import { UserPlus, Check, X } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Live password validation checks
  const pwd = formData.password;
  const checks = {
    length: pwd.length > 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
  const isPasswordValid = checks.length && checks.upper && checks.lower && checks.special;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register({
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      company_name: formData.company_name.trim() || undefined,
      password: formData.password,
      role: 'CUSTOMER',
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message || 'Registration failed. The email may already be in use.');
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
        padding: 'var(--space-4)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-on-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 'var(--font-size-xl)',
              marginBottom: 'var(--space-3)',
            }}
          >
            R
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-main)' }}>
            Create Revora Account
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Access courses, subscriptions, and self-service billing
          </p>
        </div>

        {success ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-6)',
              backgroundColor: 'var(--status-success-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--status-success-border)',
              color: 'var(--status-success-text)',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#065f46' }}>
              Registration Successful!
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorMessage title="Registration Failed" message={error} />
              </div>
            )}

            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Alex Kumar"
              required
            />

            <Input
              label="Company or Institute (Optional)"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g. Acme Labs or University"
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {/* Password Requirement Badges */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                fontSize: '11px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Password Security Criteria:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <span style={{ color: checks.length ? '#059669' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {checks.length ? <Check size={12} /> : <X size={12} />} &gt; 8 characters
                </span>
                <span style={{ color: checks.upper ? '#059669' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {checks.upper ? <Check size={12} /> : <X size={12} />} 1 Uppercase letter
                </span>
                <span style={{ color: checks.lower ? '#059669' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {checks.lower ? <Check size={12} /> : <X size={12} />} 1 Lowercase letter
                </span>
                <span style={{ color: checks.special ? '#059669' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {checks.special ? <Check size={12} /> : <X size={12} />} 1 Special character
                </span>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={UserPlus}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              Create Account
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

