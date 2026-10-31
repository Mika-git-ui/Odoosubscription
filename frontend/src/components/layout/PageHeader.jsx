import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  children,
  badge,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#20242D',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#F3E8FF',
                color: '#7952CC',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#87909E',
              margin: '0.25rem 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
