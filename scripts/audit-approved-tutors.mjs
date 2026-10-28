import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  getFirestore,
  getDocs,
  query,
  terminate,
  where,
} from 'firebase/firestore';

const privateLocationFields = [
  'coordinates',
  'homeAddress',
  'homeAddressCoordinates',
  'homeAddressGeocodeKey',
  'locationAreaCoordinates',
  'locationAreaGeocodeKey',
];

const legacyApplicationFields = [
  'courses',
  'applicationProofName',
  'applicationProofUrl',
  'paymentQrUrl',
  'verificationReviewedBy',
  'verificationReviewedAt',
];

const publicTutorFields = new Set([
  'name',
  'tutorType',
  'tier',
  'credentials',
  'preferredDays',
  'preferredTimeSlots',
  'courseNames',
  'teachingPhilosophy',
  'formats',
  'verificationStatus',
  'verificationNote',
  'publicProfileVersion',
  'locationPrivacyVersion',
  'createdAt',
  'updatedAt',
  'photoUrl',
  'location',
  'locationCell',
  'locationCellVersion',
  'availability',
  'online',
  'lastSeenAt',
  'rating',
  'reviewCount',
  'lastRatingBookingId',
  'totalRecordedTeachingSeconds',
  'lastTeachingBookingId',
  'hourlyRate',
  'bio',
  'subject',
]);

export function auditApprovedTutor(id, data) {
  const fields = Object.keys(data);
  const profileVersionMismatch = data.publicProfileVersion !== 2;
  const locationPrivacyVersionMismatch = data.locationPrivacyVersion !== 1;
  const privateLocationFieldsFound = privateLocationFields.filter((field) =>
    Object.hasOwn(data, field));
  const legacyApplicationFieldsFound = legacyApplicationFields.filter((field) =>
    Object.hasOwn(data, field));
  const otherUnsupportedFields = fields.filter((field) =>
    !publicTutorFields.has(field) &&
    !privateLocationFields.includes(field) &&
    !legacyApplicationFields.includes(field));

  return {
    id,
    profileVersionMismatch,
    locationPrivacyVersionMismatch,
    privateLocationFields: privateLocationFieldsFound,
    legacyApplicationFields: legacyApplicationFieldsFound,
    otherUnsupportedFields,
  };
}

function parseLocalEnv(contents) {
  return Object.fromEntries(
    contents.split(/\r?\n/).flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return [];
      const separator = trimmed.indexOf('=');
      if (separator < 1) return [];
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return [[key, value]];
    }),
  );
}

async function loadFirebaseConfig() {
  let localEnv = {};
  try {
    localEnv = parseLocalEnv(await readFile('.env.local', 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const env = { ...localEnv, ...process.env };
  const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const expectedProjectId = env.TUTORLY_AUDIT_EXPECTED_PROJECT_ID;
  if (!projectId || !expectedProjectId) {
    throw new Error(
      'Set EXPO_PUBLIC_FIREBASE_PROJECT_ID in .env.local and TUTORLY_AUDIT_EXPECTED_PROJECT_ID in your shell.',
    );
  }
  if (projectId !== expectedProjectId) {
    throw new Error(
      `Project ID mismatch: configured "${projectId}" but expected "${expectedProjectId}".`,
    );
  }
  if (env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    throw new Error('Disable emulator mode before running this live-data audit.');
  }
  if (!env.EXPO_PUBLIC_FIREBASE_API_KEY || !env.EXPO_PUBLIC_FIREBASE_APP_ID) {
    throw new Error('Firebase API key and app ID must be set in .env.local.');
  }

  return {
    projectId,
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

async function main() {
  const email = process.env.TUTORLY_AUDIT_ADMIN_EMAIL;
  const password = process.env.TUTORLY_AUDIT_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set TUTORLY_AUDIT_ADMIN_EMAIL and TUTORLY_AUDIT_ADMIN_PASSWORD in the current shell. Do not put these credentials in .env.local or a source file.',
    );
  }

  const firebaseConfig = await loadFirebaseConfig();
  const app = initializeApp(firebaseConfig, 'approved-tutor-read-only-audit');
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    const tutors = await getDocs(query(
      collection(db, 'tutors'),
      where('verificationStatus', '==', 'approved'),
    ));
    const report = tutors.docs.map((snapshot) =>
      auditApprovedTutor(snapshot.id, snapshot.data()));
    const candidates = report.filter((item) =>
      item.profileVersionMismatch ||
      item.locationPrivacyVersionMismatch ||
      item.privateLocationFields.length > 0 ||
      item.legacyApplicationFields.length > 0 ||
      item.otherUnsupportedFields.length > 0);

    console.log(`Project: ${firebaseConfig.projectId}`);
    console.log(`Approved tutor profiles scanned: ${report.length}`);
    console.log(`Profiles needing review: ${candidates.length}`);
    if (candidates.length) {
      console.log(JSON.stringify(candidates, null, 2));
    } else {
      console.log('No approved profiles failed the audited version/field checks.');
    }
    console.log(
      'Read-only audit: document IDs and field names only; no profile values were printed or changed.',
    );
  } finally {
    await signOut(auth);
    await terminate(db);
    await deleteApp(app);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Tutor audit failed: ${error.message}`);
    process.exitCode = 1;
  });
}
