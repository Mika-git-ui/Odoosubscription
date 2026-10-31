import React from 'react';

/**
 * Reusable Form Input Component with label, inline error, and helper text.
 */
export const Input = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

export default Input;

