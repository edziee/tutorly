import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { rankStudentLeaderboard } from '../utils/studentLeaderboard';

export function subscribeToStudentLeaderboard(callback, onError = console.error) {
  if (typeof callback !== 'function') {
    throw new Error('A callback is required to subscribe to the student leaderboard.');
  }
  const { db } = requireFirebase();
  return onSnapshot(
    collection(db, COLLECTIONS.STUDENT_LEADERBOARD),
    (snapshot) => callback(rankStudentLeaderboard(
      snapshot.docs.map((item) => ({ ...item.data(), studentId: item.id })),
    ), { fromCache: snapshot.metadata.fromCache }),
    onError,
  );
}

export async function saveStudentLeaderboardStats(
  uid,
  { displayName, badgeCount, currentStreak } = {},
) {
  if (
    typeof uid !== 'string' || !uid.trim() ||
    typeof displayName !== 'string' || !displayName.trim() ||
    displayName.length > 120 ||
    !Number.isSafeInteger(badgeCount) || badgeCount < 0 ||
    !Number.isSafeInteger(currentStreak) || currentStreak < 0
  ) {
    throw new Error('Valid student leaderboard name, badge count, and streak are required.');
  }

  const { db } = requireFirebase();
  await setDoc(doc(db, COLLECTIONS.STUDENT_LEADERBOARD, uid), {
    displayName,
    badgeCount,
    currentStreak,
    updatedAt: serverTimestamp(),
  });
}
