// Checks for the login and sign-up forms. Each function returns an error
// message to show under the field, or '' when the value is fine.
// These only catch typing mistakes early. The real checks happen in Firebase.

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const email = (value ?? '').trim();
  if (!email) return 'Enter your email.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email, like name@tip.edu.ph.';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Enter your password.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return '';
}

// For the login screen: an existing account may have an older password, so only
// check that something was typed.
export function validatePasswordPresent(value) {
  return value ? '' : 'Enter your password.';
}

export function validateRequired(value, fieldName) {
  return (value ?? '').trim() ? '' : `Enter ${fieldName}.`;
}
