// Reads and writes the user document (users/{uid}): name, role, contact info,
// campus, streak and so on. See docs/FIRESTORE_SCHEMA.md for the fields.
// Owner: Member 1.   Replaces: src/data/mockStudentProfile.jsx
//
//   import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
//   import { requireFirebase } from '../config/firebase';
//   import { COLLECTIONS } from '../constants/collections';
import { notImplemented } from './notImplemented';

/**
 * @param {string} uid
 * @returns {Promise<object | null>} the user document, or null if it does not exist
 */
export async function getUserProfile(uid) {
  throw notImplemented('userService.getUserProfile', 'Member 1');
}

/**
 * Create the document right after sign-up. The `role` is set here once and the
 * security rules (Week 3) must stop users from changing it later.
 * @param {string} uid
 * @param {{ email: string, role: string, name?: string }} data
 * @returns {Promise<void>}
 */
export async function createUserProfile(uid, data) {
  throw notImplemented('userService.createUserProfile', 'Member 1');
}

/**
 * Save changes from the profile screen. Never pass `role` here.
 * @param {string} uid
 * @param {object} changes
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, changes) {
  throw notImplemented('userService.updateUserProfile', 'Member 1');
}
