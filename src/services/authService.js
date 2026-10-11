// Sign-up, login and logout for all four roles.
// Owner: Member 1.   Used by: src/context/AuthContext.jsx and the login screens.
//
// Rules for everyone: screens never call Firebase directly. They call the
// functions in this folder, so the layout (Member 3) and the data (the feature
// owner) can be built at the same time against the same function names.
//
// Start from `requireFirebase()` in src/config/firebase.js:
//   import { requireFirebase } from '../config/firebase';
//   const { auth, db } = requireFirebase();
// Firebase Auth docs: https://firebase.google.com/docs/auth/web/start
import { notImplemented } from './notImplemented';

/**
 * Create an account and its user document (users/{uid}) with the chosen role.
 * Admin accounts cannot be created here.
 * @param {{ email: string, password: string, role: 'student'|'tutor'|'professional', profile?: object }} input
 * @returns {Promise<{ uid: string, role: string }>}
 */
export async function signUp(input) {
  throw notImplemented('authService.signUp', 'Member 1');
}

/**
 * Log in with email and password (student, tutor and professional login).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ uid: string, role: string }>}
 */
export async function signIn(email, password) {
  throw notImplemented('authService.signIn', 'Member 1');
}

/**
 * Hidden admin login. Must sign the user out and throw if the account's role
 * is not 'admin', so a normal user can never enter the admin dashboard.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ uid: string, role: 'admin' }>}
 */
export async function signInAdmin(email, password) {
  throw notImplemented('authService.signInAdmin', 'Member 1');
}

/** Log out the current user. @returns {Promise<void>} */
export async function signOut() {
  throw notImplemented('authService.signOut', 'Member 1');
}

/**
 * Call `callback(firebaseUser | null)` whenever the login state changes.
 * @param {(user: object | null) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToAuthState(callback) {
  throw notImplemented('authService.subscribeToAuthState', 'Member 1');
}
