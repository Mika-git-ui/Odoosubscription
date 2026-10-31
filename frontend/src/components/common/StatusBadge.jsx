import React from 'react';
import { getStatusConfig } from '../../utils/formatters';

/**
 * Reusable StatusBadge Component
 * Automatically styles badges based on entity status (e.g., ACTIVE, PAID, OVERDUE, DRAFT).
 */
export const StatusBadge = ({ status, variant: customVariant, label: customLabel, className = '' }) => {
  const config = getStatusConfig(status);
  const variant = customVariant || config.variant;
  const label = customLabel || config.label;

  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      <span className="badge-dot" />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;

