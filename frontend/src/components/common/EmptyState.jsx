import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State Component
 * Provides clean illustration, explanatory text, and primary call-to-action button.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data available in this section.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        borderStyle: 'dashed',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-subtle)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={26} />
      </div>

      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: actionLabel ? '1.25rem' : 0 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

