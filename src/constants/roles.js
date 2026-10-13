// The four types of users in Tutorly.
// The value is what gets saved in the `role` field of the user's document in
// Firestore (see docs/FIRESTORE_SCHEMA.md). Use ROLES.STUDENT in code instead
// of typing the string 'student' so a typo cannot slip in.
export const ROLES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  PROFESSIONAL: 'professional', // professors and alumni
  ADMIN: 'admin',
};

export const ROLE_VALUES = Object.values(ROLES);

// Roles a person can choose on the sign-up screen. Admin accounts are never
// created from the app: the team creates them directly in Firebase.
export const SIGNUP_ROLES = [ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL];

export const isValidRole = (value) => ROLE_VALUES.includes(value);

// Names to show on screen for each role.
export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.TUTOR]: 'Tutor',
  [ROLES.PROFESSIONAL]: 'Professional Tutor',
  [ROLES.ADMIN]: 'Admin',
};
