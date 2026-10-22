// Reads and writes the user document (users/{uid}): name, role, contact info,
// campus, streak and so on. See docs/FIRESTORE_SCHEMA.md for the fields.
// Owner: Member 1. Stores user profiles in Firestore.
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { isValidRole } from '../constants/roles';
import { TUTOR_TYPES } from '../constants/statuses';

// Fields a screen must never change through updateUserProfile. `role` is set
// once at sign-up (the Week 3 security rules enforce this on the server too).
const PROTECTED_FIELDS = ['id', 'uid', 'role', 'email', 'createdAt', 'tutorType'];

/**
 * @param {string} uid
 * @returns {Promise<object | null>} the user document (with `id` and `uid`
 *   added, because the document id is not a field inside the document), or
 *   null if it does not exist
 */
export async function getUserProfile(uid) {
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snapshot.exists()) return null;
  return { ...snapshot.data(), id: snapshot.id, uid: snapshot.id };
}

/**
 * Create the document right after sign-up. The `role` is set here once and the
 * security rules (Week 3) must stop users from changing it later.
 * Only known fields are saved, so a caller cannot slip extra data in.
 * @param {string} uid
 * @param {{ email: string, role: string, name?: string, campusId?: string, tutorType?: string }} data
 * @returns {Promise<void>}
 */
export async function createUserProfile(uid, data) {
  if (!uid) throw new Error('createUserProfile needs a uid.');
  if (!isValidRole(data?.role)) throw new Error(`createUserProfile: invalid role "${data?.role}".`);
  if (
    data.role === 'tutor' &&
    !Object.values(TUTOR_TYPES).includes(data.tutorType)
  ) {
    throw new Error('createUserProfile needs a valid tutor type for tutor accounts.');
  }

  const { db } = requireFirebase();
  await setDoc(doc(db, COLLECTIONS.USERS, uid), {
    email: data.email,
    role: data.role,
    name: data.name ?? '',
    campusId: data.campusId ?? '',
    ...(data.role === 'tutor' ? { tutorType: data.tutorType } : {}),
    createdAt: serverTimestamp(),
  });
}

/**
 * Save changes from the profile screen. Never pass `role` here: it is removed
 * if you do.
 * @param {string} uid
 * @param {object} changes
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, changes) {
  const { db } = requireFirebase();
  const safeChanges = { ...changes };
  PROTECTED_FIELDS.forEach((field) => delete safeChanges[field]);
  if (Object.keys(safeChanges).length === 0) return;
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), safeChanges);
}
