// Turns an error thrown by a service into a message a person can read.
//
// Firebase errors have a `code` such as "auth/invalid-credential" and a message
// meant for developers, so the screens show these texts instead. Messages that
// we wrote ourselves for the team ("... is not implemented yet", "Firebase is
// not configured ...") are shown as they are, so a teammate who opens a screen
// before its service is finished sees what is missing.

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'That password is too weak. Use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact the team.',
  'auth/profile-missing': 'This account is not set up yet. Sign up again or contact the team.',
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
  if (error?.code === 'permission-denied') return 'You do not have permission to see this.';
  if (error?.code === 'unavailable') return 'No internet connection. Check your connection and try again.';
  return fallback;
}
