// Sign-up, login and logout for all four roles.
// Owner: Member 1.   Used by: src/context/AuthContext.jsx and the login screens.
//
// Rules for everyone: screens never call Firebase directly. They call the
// functions in this folder, so the layout (Member 3) and the data (the feature
// owner) can be built at the same time against the same function names.
// Firebase Auth docs: https://firebase.google.com/docs/auth/web/start
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { isFirebaseConfigured, requireAuth, requireFirebase } from '../config/firebase';
import { isRoleAllowedInPortal, LOGIN_ROLES, ROLES, SIGNUP_ROLES } from '../constants/roles';
import { createUserProfile, getUserProfile } from './userService';

// Errors we throw ourselves use Firebase-style codes so src/utils/errors.js can
// turn them into messages for the screens.
function authError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Sign-up and login take several steps (Firebase Auth, then the users/{uid}
// document). Firebase announces the new login to subscribeToAuthState after the
// first step, which would reach the app before the document exists or before we
// have checked the role. While one of these flows runs, the listener waits for
// it to finish, so the app never sees a half-finished account.
let flowInProgress = null;

async function runAuthFlow(flow) {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  flowInProgress = gate;
  try {
    return await flow();
  } finally {
    release();
    if (flowInProgress === gate) flowInProgress = null;
  }
}

/**
 * Create an account and its user document (users/{uid}) with the chosen role.
 * Admin accounts cannot be created here.
 * @param {{ email: string, password: string, role: 'student'|'tutor', profile?: object }} input
 * @returns {Promise<{ uid: string, role: string }>}
 */
export async function signUp({ email, password, role, profile = {} } = {}) {
  // Check the role before talking to Firebase. Admin is never allowed here.
  if (!SIGNUP_ROLES.includes(role)) {
    throw authError('auth/invalid-role', 'That account type cannot be created from the app.');
  }
  const { auth } = requireFirebase();
  const cleanEmail = (email ?? '').trim();

  return runAuthFlow(async () => {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const { user } = credential;

    try {
      await createUserProfile(user.uid, {
        email: cleanEmail,
        role,
        name: profile.name,
        campusId: profile.campusId,
        tutorType: profile.tutorType,
      });
    } catch (error) {
      // The login exists but the profile could not be saved. Remove the login
      // so the person can try again with the same email instead of being stuck
      // with an account that has no role.
      try {
        await deleteUser(user);
      } catch (cleanupError) {
        await firebaseSignOut(auth).catch(() => {});
      }
      throw error;
    }

    return { uid: user.uid, role };
  });
}

/**
 * Log in with email and password from the selected student or tutor portal.
 * Admins must use signInAdmin, so they are refused here.
 * @param {string} email
 * @param {string} password
 * @param {'student'|'tutor'} portal
 * @returns {Promise<{ uid: string, role: string }>}
 */
export async function signIn(email, password, portal) {
  if (![ROLES.STUDENT, ROLES.TUTOR].includes(portal)) {
    throw authError('auth/invalid-portal', 'Choose Student or Tutor to sign in.');
  }
  const { auth } = requireFirebase();

  return runAuthFlow(async () => {
    const { user } = await signInWithEmailAndPassword(auth, (email ?? '').trim(), password);

    let profile;
    try {
      profile = await getUserProfile(user.uid);
    } catch (error) {
      await firebaseSignOut(auth).catch(() => {});
      throw error;
    }

    if (!profile || !LOGIN_ROLES.includes(profile.role)) {
      await firebaseSignOut(auth).catch(() => {});
      if (profile?.role === ROLES.ADMIN) {
        throw authError('auth/use-admin-login', 'Admin accounts cannot sign in here.');
      }
      throw authError(
        'auth/profile-missing',
        'This account is not set up yet. Sign up again or contact the team.',
      );
    }

    if (!isRoleAllowedInPortal(profile.role, portal)) {
      await firebaseSignOut(auth);
      throw authError(
        'auth/role-mismatch',
        'This account is registered for a different portal. Select the correct portal and try again.',
      );
    }

    return { uid: user.uid, role: profile.role };
  });
}

/**
 * Hidden admin login. Must sign the user out and throw if the account's role
 * is not 'admin', so a normal user can never enter the admin dashboard.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ uid: string, role: 'admin' }>}
 */
export async function signInAdmin(email, password) {
  const { auth } = requireFirebase();

  return runAuthFlow(async () => {
    const { user } = await signInWithEmailAndPassword(auth, (email ?? '').trim(), password);

    let profile;
    try {
      profile = await getUserProfile(user.uid);
    } catch (error) {
      await firebaseSignOut(auth);
      throw error;
    }

    if (profile?.role !== ROLES.ADMIN) {
      await firebaseSignOut(auth);
      throw authError('auth/not-admin', 'This account is not authorized for admin access.');
    }

    return { uid: user.uid, role: ROLES.ADMIN };
  });
}

/** Log out the current user. @returns {Promise<void>} */
export async function signOut() {
  await firebaseSignOut(requireAuth());
}

/**
 * Call `callback(firebaseUser | null)` whenever the login state changes.
 * If Firebase is not configured (no .env.local), it reports "logged out" once
 * so the app still opens and the team can keep working on screens.
 * @param {(user: object | null) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToAuthState(callback) {
  if (!isFirebaseConfigured) {
    let active = true;
    Promise.resolve().then(() => {
      if (active) callback(null);
    });
    return () => {
      active = false;
    };
  }

  const { auth } = requireFirebase();
  let active = true;

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // Wait for a sign-up or login that is still finishing (see runAuthFlow).
    if (flowInProgress) await flowInProgress;
    if (!active) return;
    // If that flow signed the person out again (wrong role, missing profile),
    // this event is out of date. Firebase sends a fresh "logged out" next.
    if (firebaseUser && auth.currentUser?.uid !== firebaseUser.uid) return;
    callback(firebaseUser);
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
