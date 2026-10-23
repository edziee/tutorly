// Turns an error thrown by a service into a message a person can read.
//
// Firebase errors have a `code` such as "auth/invalid-credential" and a message
// meant for developers, so the screens show these texts instead. Messages that
// we wrote ourselves for the team ("... is not implemented yet", "Firebase is
// not configured ...") are shown as they are, so a teammate who opens a screen
// before its service is finished sees what is missing.

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes, then try again.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
  'auth/user-disabled': 'This account is unavailable. Contact support.',
  'auth/profile-missing': 'We couldn’t find your account details. Try signing up again or contact support.',
  'auth/not-admin': 'This account can’t access the admin area.',
  'auth/role-mismatch': 'This account is registered for another role. Choose the right role and try again.',
  'auth/invalid-portal': 'Choose Student or Tutor to sign in.',
};

const GENERIC = 'Something went wrong. Please try again.';

const isTeamMessage = (message) =>
  typeof message === 'string' &&
  (message.includes('is not implemented yet') || message.includes('Firebase is not configured'));

// For login and sign-up errors.
export function getAuthErrorMessage(error) {
  const known = AUTH_MESSAGES[error?.code];
  if (known) return known;
  return isTeamMessage(error?.message) ? error.message : GENERIC;
}

// For errors when loading or saving data.
export function getErrorMessage(error, fallback = GENERIC) {
  if (isTeamMessage(error?.message)) return error.message;
  if (error?.code === 'permission-denied') return 'You don’t have access to this.';
  if (error?.code === 'unavailable') return 'Check your internet connection and try again.';
  return fallback;
}
