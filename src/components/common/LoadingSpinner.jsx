import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner & Skeleton Components
 */
export const LoadingSpinner = ({ size = 28, text = 'Loading...', className = '' }) => {
  return (
    <div
      className={`flex-center ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        gap: '0.75rem',
        color: 'var(--text-muted)',
      }}
    >
      <Loader2 size={size} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      {text && <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{text}</span>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div style={{ width: '100%', padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div
          key={rIndex}
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {Array.from({ length: cols }).map((_, cIndex) => (
            <div
              key={cIndex}
              style={{
                height: '16px',
                flex: 1,
                backgroundColor: 'var(--border-subtle)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;

