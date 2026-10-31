import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Error Message Banner / Retry Card
 */
export const ErrorMessage = ({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: 'var(--status-danger-bg)',
        borderColor: 'var(--status-danger-border)',
        color: 'var(--status-danger-text)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}
    >
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>
          {title}
        </h4>
        <p style={{ fontSize: 'var(--font-size-xs)', color: '#7f1d1d', margin: 0 }}>
          {message || 'Unable to complete the requested operation. Please verify backend connectivity.'}
        </p>
        {onRetry && (
          <div style={{ marginTop: '0.75rem' }}>
            <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry}>
              Retry Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

