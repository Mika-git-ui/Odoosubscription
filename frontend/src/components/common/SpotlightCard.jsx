import React from 'react';

/**
 * Modern SaaS Spotlight Card with Mouse-Track Radial Glow Effect
 * Inspired by Linear & Vercel design systems.
 */
export const SpotlightCard = ({
  children,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      className={`card card-spotlight ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;

