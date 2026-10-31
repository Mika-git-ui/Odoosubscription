import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { isValidEmail } from '../../utils/validators';
import authApi from '../../api/auth';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process reset request. Please check your email.');
    } finally {
      setLoading(false);
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
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-main)' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter your email to receive password recovery instructions
          </p>
        </div>

        {submitted ? (
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
            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto var(--space-2)' }} />
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: '#065f46' }}>
              Reset Link Sent
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)', color: '#047857' }}>
              If an account matches <strong>{email}</strong>, a recovery link has been delivered to your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <ErrorMessage title="Error" message={error} />
              </div>
            )}

            <Input
              label="Registered Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={Mail}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              Send Password Reset Link
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

