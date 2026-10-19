// The user roles in Tutorly. `professional` is retained for existing accounts;
// new professor/alumni sign-ups use the shared `tutor` role.
// The value is what gets saved in the `role` field of the user's document in
// Firestore (see docs/FIRESTORE_SCHEMA.md). Use ROLES.STUDENT in code instead
// of typing the string 'student' so a typo cannot slip in.
export const ROLES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  PROFESSIONAL: 'professional', // legacy role; new accounts use TUTOR
  ADMIN: 'admin',
};

export const ROLE_VALUES = Object.values(ROLES);

// Roles a person can choose on the sign-up screen. Admin accounts are never
// created from the app: the team creates them directly in Firebase.
export const SIGNUP_ROLES = [ROLES.STUDENT, ROLES.TUTOR];
export const LOGIN_ROLES = [...SIGNUP_ROLES, ROLES.PROFESSIONAL];

export const isValidRole = (value) => ROLE_VALUES.includes(value);
export const isTutorRole = (value) => value === ROLES.TUTOR || value === ROLES.PROFESSIONAL;
export const isRoleAllowedInPortal = (role, portal) =>
  (portal === ROLES.STUDENT && role === ROLES.STUDENT) ||
  (portal === ROLES.TUTOR && isTutorRole(role));

// Names to show on screen for each role.
export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.TUTOR]: 'Tutor',
  [ROLES.PROFESSIONAL]: 'Tutor',
  [ROLES.ADMIN]: 'Admin',
};
