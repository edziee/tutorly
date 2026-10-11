// Firebase setup. This is the only file that creates the Firebase app.
// Everything else gets `auth`, `db` and `storage` from here (through the files
// in src/services).
//
// Setup (Member 1, Week 1):
//   1. Create the Firebase project and a Web app in the Firebase console.
//   2. Copy .env.example to .env.local and paste the config values.
//   3. Restart Expo with `npx expo start -c` so the new variables are picked up.
//
// Expo SDK 57 uses the Firebase JS SDK (firebase 12). It works in Expo Go.
// Docs: https://docs.expo.dev/guides/using-firebase/
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Write each variable out in full with dot notation. Expo only replaces
// process.env.EXPO_PUBLIC_NAME when it is written exactly like this.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// False until .env.local is filled in. The app still opens without it, so a
// member who has not set Firebase up yet can keep working on screens.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

function createAuth(app) {
  // On the web, Firebase already keeps the user signed in.
  if (Platform.OS === 'web') return getAuth(app);

  // On Android and iOS, keep the user signed in between app launches.
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // initializeAuth can only run once. After a Fast Refresh it has already
    // run, so reuse the existing instance.
    if (error?.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}

function createFirestore(app) {
  // Auto-detect long polling avoids "could not reach Cloud Firestore backend"
  // errors on networks where React Native cannot use streaming connections.
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (error) {
    // Already initialized (Fast Refresh): reuse the existing instance.
    return getFirestore(app);
  }
}

const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? createAuth(app) : null;
export const db = app ? createFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Call this at the top of a service function. It gives a clear message instead
// of "cannot read property of null" when .env.local is missing.
export function requireFirebase() {
  if (!auth || !db || !storage) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local, fill in the values from the Firebase console, then restart Expo with "npx expo start -c".',
    );
  }
  return { auth, db, storage };
}
