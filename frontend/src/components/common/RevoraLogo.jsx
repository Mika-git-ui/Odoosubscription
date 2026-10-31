import React from 'react';

/**
 * Revora Brand Logo
 * Faithful recreation of the glowing gradient nebula orb from the design reference screenshot.
 * Features:
 * - Electric violet, indigo, and warm golden flame gradient
 * - Smooth SVG vectors that scale to any resolution
 * - Subtle inner core luminescence
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
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(121, 82, 204, 0.45))' }}
      >
        <defs>
          {/* Outer glowing violet/indigo orb */}
          <linearGradient id="revoraOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#7952CC" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Warm electric core flame */}
          <linearGradient id="revoraCoreGrad" x1="20%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Radial ambient glow */}
          <radialGradient id="revoraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient background glow ring */}
        <circle cx="20" cy="20" r="18" fill="url(#revoraGlow)" opacity="0.6" />

        {/* Main outer rounded container */}
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="10"
          fill="url(#revoraOuterGrad)"
        />

        {/* Dynamic inner nebula swirl / flame curve */}
        <path
          d="M20 9C15.5 13 13 16.5 13 21C13 25.5 16.5 29 20.5 29C25 29 28 25.5 28 21.5C28 17.5 24.5 15.5 23 13C22 11.5 21 10 20 9Z"
          fill="url(#revoraCoreGrad)"
          opacity="0.95"
        />

        {/* Vibrant central highlight spark */}
        <circle cx="20" cy="20" r="3" fill="#FFFFFF" opacity="0.9" />

        {/* Subtle geometric accent arc */}
        <path
          d="M12 14C13.5 11.5 16.5 10 20 10"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

      {withText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '1rem',
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
