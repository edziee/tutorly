import { AppState } from 'react-native';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { requireFirebase } from '../config/firebase';
import { TUTOR_PRESENCE_HEARTBEAT_MS } from '../utils/tutorPresence';

export function watchTutorPresence(userId, onError = console.error) {
  const { auth, db } = requireFirebase();
  if (auth.currentUser?.uid !== userId) {
    throw new Error('You can only publish presence for the signed-in account.');
  }

  const tutorRef = doc(db, 'tutors', userId);
  let tutorIsApproved = false;
  let appState = AppState.currentState;
  let isOnline = false;
  let heartbeat;
  let disposed = false;
  let pendingWrite = Promise.resolve();

  function writePresence(online) {
    pendingWrite = pendingWrite
      .then(() => {
        if (disposed && online) return;
        if (!tutorIsApproved) return;
        return updateDoc(tutorRef, {
          online,
          lastSeenAt: serverTimestamp(),
        });
      })
      .catch((error) => {
        onError(error);
      });
    return pendingWrite;
  }

  function stopHeartbeat() {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = undefined;
  }

  function synchronizePresence() {
    const shouldBeOnline = tutorIsApproved && appState === 'active';
    if (shouldBeOnline && !isOnline) {
      isOnline = true;
      writePresence(true);
      heartbeat = setInterval(() => writePresence(true), TUTOR_PRESENCE_HEARTBEAT_MS);
    } else if (!shouldBeOnline && isOnline) {
      isOnline = false;
      stopHeartbeat();
      writePresence(false);
    }
  }

  const stopProfileListener = onSnapshot(
    tutorRef,
    (snapshot) => {
      tutorIsApproved = snapshot.exists() &&
        snapshot.data().verificationStatus === 'approved';
      synchronizePresence();
    },
    onError,
  );
  const appStateListener = AppState.addEventListener('change', (nextState) => {
    appState = nextState;
    synchronizePresence();
  });

  return () => {
    if (disposed) return pendingWrite;
    disposed = true;
    stopHeartbeat();
    appStateListener.remove();
    stopProfileListener();
    if (isOnline) {
      isOnline = false;
      return writePresence(false);
    }
    return pendingWrite;
  };
}
