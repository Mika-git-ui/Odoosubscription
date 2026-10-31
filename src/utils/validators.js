/**
 * REVORA INPUT VALIDATION UTILITIES
 * Enforces strict client-side validation rules matching backend expectations.
 */

/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates Revora password complexity requirements:
 * - More than 8 characters (> 8)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 * @param {string} password
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validatePassword = (password) => {
  if (!password || password.length <= 8) {
    return { isValid: false, message: 'Password must be more than 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
};

/**
 * Validates positive numeric input.
 * @param {number|string} value
 * @param {boolean} allowZero
 * @returns {boolean}
 */
export const isPositiveNumber = (value, allowZero = false) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return allowZero ? num >= 0 : num > 0;
};

/**
 * Validates that an end date is on or after a start date.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {boolean}
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

