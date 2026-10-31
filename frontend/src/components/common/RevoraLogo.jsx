import React from 'react';
import logoImg from '../../assets/revora-logo.png';

/**
 * Official Revora Logo Component
 * Renders the provided 3D ribbon 'R' with upward arrow.
 */
export const RevoraLogo = ({
  size = 32,
  withText = false,
  subtitle = 'WORKSPACE',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src={logoImg}
        alt="Revora Logo"
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 8px rgba(121, 82, 204, 0.35))',
        }}
      />

      {withText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Revora
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: '9.5px',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RevoraLogo;
