import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import {
  MAX_STUDENT_BADGE_NOTE_LENGTH,
  STUDENT_BADGE_BY_ID,
} from '../constants/gamification';
import { assertApprovedTutor } from './tutorService';

const AWARD_COLLECTION = 'badgeAwards';
const STUDENT_VISIBILITY_COLLECTION = 'studentBadgeVisibility';
const TUTOR_VISIBILITY_COLLECTION = 'tutorAchievementVisibility';

function getSignedInFirebase() {
  const firebase = requireFirebase();
  const uid = firebase.auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to view or manage badges.');
  return { ...firebase, uid };
}

function assertOwnUser(requestedUid, signedInUid, action) {
  if (!requestedUid || requestedUid !== signedInUid) {
    throw new Error(`You can only ${action} your own badges.`);
  }
}

function toAward(snapshot) {
  const data = snapshot.data();
  return { ...data, id: data.bookingId };
}

function toAchievement(snapshot) {
  return { ...snapshot.data(), id: snapshot.id };
}

export async function awardStudentBadge({ bookingId, badgeId, note } = {}) {
  if (typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('A completed booking is required to award a badge.');
  }
  if (typeof badgeId !== 'string' || !STUDENT_BADGE_BY_ID[badgeId]) {
    throw new Error('Choose a badge from the student badge catalog.');
  }
  if (note != null && typeof note !== 'string') {
    throw new Error('The badge note must be text.');
  }
  const normalizedNote = typeof note === 'string' ? note.trim() : '';
  if (normalizedNote.length > MAX_STUDENT_BADGE_NOTE_LENGTH) {
    throw new Error(`The badge note must be ${MAX_STUDENT_BADGE_NOTE_LENGTH} characters or fewer.`);
  }

  const { db, uid } = getSignedInFirebase();
  await assertApprovedTutor(uid);

  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  const awardRef = doc(db, COLLECTIONS.BOOKINGS, bookingId, AWARD_COLLECTION, 'award');
  await runTransaction(db, async (transaction) => {
    const [bookingSnapshot, awardSnapshot] = await Promise.all([
      transaction.get(bookingRef),
      transaction.get(awardRef),
    ]);
    if (!bookingSnapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = bookingSnapshot.data();
    if (booking.tutorId !== uid) {
      throw new Error('Only the assigned tutor can recognize this student.');
    }
    if (booking.status !== 'completed') {
      throw new Error('A badge can only be given after the session is completed.');
    }
    if (awardSnapshot.exists()) {
      throw new Error('A badge has already been given for this booking.');
    }

    transaction.set(awardRef, {
      badgeId,
      bookingId,
      tutorId: uid,
      studentId: booking.studentId,
      ...(normalizedNote ? { note: normalizedNote } : {}),
      createdAt: serverTimestamp(),
    });
  });
}

export function subscribeToStudentBadgeAwards(studentId, callback, onError = console.error) {
  const { db, uid } = getSignedInFirebase();
  assertOwnUser(studentId, uid, 'view');
  return onSnapshot(
    query(
      collectionGroup(db, AWARD_COLLECTION),
      where('studentId', '==', uid),
      orderBy('createdAt', 'desc'),
    ),
    (snapshot) => callback(snapshot.docs.map(toAward), { fromCache: snapshot.metadata.fromCache }),
    onError,
  );
}

export function subscribeToTutorBadgeAwards(tutorId, callback, onError = console.error) {
  const { db, uid } = getSignedInFirebase();
  assertOwnUser(tutorId, uid, 'view');
  return onSnapshot(
    query(
      collectionGroup(db, AWARD_COLLECTION),
      where('tutorId', '==', uid),
      orderBy('createdAt', 'desc'),
    ),
    (snapshot) => callback(snapshot.docs.map(toAward), { fromCache: snapshot.metadata.fromCache }),
    onError,
  );
}

export function subscribeToTutorAchievements(tutorId, callback, onError = console.error) {
  const { db, uid } = getSignedInFirebase();
  assertOwnUser(tutorId, uid, 'view');
  return onSnapshot(
    query(
      collection(db, COLLECTIONS.TUTOR_ACHIEVEMENTS),
      where('tutorId', '==', uid),
      orderBy('createdAt', 'asc'),
    ),
    (snapshot) => callback(snapshot.docs.map(toAchievement), { fromCache: snapshot.metadata.fromCache }),
    onError,
  );
}

export function subscribeToStudentBadgeVisibility(studentId, callback, onError = console.error) {
  const { db, uid } = getSignedInFirebase();
  assertOwnUser(studentId, uid, 'manage');
  return onSnapshot(
    collection(db, COLLECTIONS.USERS, uid, STUDENT_VISIBILITY_COLLECTION),
    (snapshot) => callback(
      Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data().visible])),
      { fromCache: snapshot.metadata.fromCache },
    ),
    onError,
  );
}

export function subscribeToTutorAchievementVisibility(tutorId, callback, onError = console.error) {
  const { db, uid } = getSignedInFirebase();
  assertOwnUser(tutorId, uid, 'manage');
  return onSnapshot(
    collection(db, COLLECTIONS.USERS, uid, TUTOR_VISIBILITY_COLLECTION),
    (snapshot) => callback(
      Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data().visible])),
      { fromCache: snapshot.metadata.fromCache },
    ),
    onError,
  );
}

export async function setStudentBadgeVisibility(bookingId, visible) {
  if (typeof bookingId !== 'string' || !bookingId.trim() || typeof visible !== 'boolean') {
    throw new Error('Choose a received badge and whether it should appear on your private profile.');
  }
  const { db, uid } = getSignedInFirebase();
  const awardRef = doc(db, COLLECTIONS.BOOKINGS, bookingId, AWARD_COLLECTION, 'award');
  const visibilityRef = doc(
    db,
    COLLECTIONS.USERS,
    uid,
    STUDENT_VISIBILITY_COLLECTION,
    bookingId,
  );
  await runTransaction(db, async (transaction) => {
    const awardSnapshot = await transaction.get(awardRef);
    if (!awardSnapshot.exists() || awardSnapshot.data().studentId !== uid) {
      throw new Error('You can only change the visibility of a badge you received.');
    }
    transaction.set(visibilityRef, { visible, updatedAt: serverTimestamp() });
  });
}

export async function setTutorAchievementVisibility(badgeId, visible) {
  if (typeof badgeId !== 'string' || typeof visible !== 'boolean') {
    throw new Error('Choose an earned achievement and whether it should appear on your private profile.');
  }
  const { db, uid } = getSignedInFirebase();
  const achievementRef = doc(db, COLLECTIONS.TUTOR_ACHIEVEMENTS, `${uid}_${badgeId}`);
  const visibilityRef = doc(
    db,
    COLLECTIONS.USERS,
    uid,
    TUTOR_VISIBILITY_COLLECTION,
    badgeId,
  );
  await runTransaction(db, async (transaction) => {
    const achievementSnapshot = await transaction.get(achievementRef);
    if (!achievementSnapshot.exists() || achievementSnapshot.data().tutorId !== uid) {
      throw new Error('You can only change the visibility of an achievement you earned.');
    }
    transaction.set(visibilityRef, { visible, updatedAt: serverTimestamp() });
  });
}
