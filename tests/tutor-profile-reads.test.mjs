import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getDoc,
  getFirestore,
  query,
  terminate,
  where,
} from 'firebase/firestore';
import { subscribeToChatTutors } from '../src/services/chatService.js';
import { getTutorById, getTutors } from '../src/services/tutorService.js';

const projectId = 'demo-tutorly-badges';
const firestoreRestUrl =
  `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, encodeValue(item)]),
      ),
    },
  };
}

async function seed(path, data) {
  const response = await fetch(`${firestoreRestUrl}:commit`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [{
        update: {
          name: `projects/${projectId}/databases/(default)/documents/${path}`,
          fields: Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, encodeValue(value)]),
          ),
        },
      }],
    }),
  });
  assert.equal(response.ok, true, await response.text());
}

async function createIdentity(role) {
  const app = initializeApp(
    { apiKey: 'local-only-key', projectId },
    `${role}-${randomUUID()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const credential = await createUserWithEmailAndPassword(
    auth,
    `${role}-${randomUUID()}@example.test`,
    randomUUID(),
  );
  const uid = credential.user.uid;
  await seed(`users/${uid}`, { uid, role, name: `Test ${role}` });
  return { app, auth, db, uid };
}

function waitForTutor() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop();
      reject(new Error('Timed out waiting for chat tutor query.'));
    }, 10000);
    let stop = () => {};
    stop = subscribeToChatTutors((tutors) => {
      if (!tutors.length) return;
      clearTimeout(timer);
      stop();
      resolve(tutors);
    }, (error) => {
      clearTimeout(timer);
      stop();
      reject(error);
    });
  });
}

async function cleanup(identities) {
  for (const identity of identities) {
    await terminate(identity.db);
    await deleteApp(identity.app);
  }
}

test('approved tutor discovery and chat reads work, including a marked profile with a legacy private field', async (t) => {
  const student = await createIdentity('student');
  const tutor = await createIdentity('tutor');
  t.after(() => cleanup([student, tutor]));

  const lastSeenAt = new Date();
  await seed(`tutors/${tutor.uid}`, {
    name: 'Test Tutor',
    tutorType: 'peer',
    tier: 'Peer Tutor',
    credentials: '',
    preferredDays: [],
    preferredTimeSlots: [],
    courseNames: 'MATH 001: Test',
    teachingPhilosophy: '',
    formats: ['online'],
    verificationStatus: 'approved',
    verificationNote: '',
    publicProfileVersion: 2,
    locationPrivacyVersion: 1,
    createdAt: lastSeenAt,
    updatedAt: lastSeenAt,
    subject: 'MATH 001: Test',
    online: true,
    lastSeenAt,
    homeAddress: 'EMULATOR_ONLY_PRIVATE_ADDRESS',
  });

  globalThis.__tutorlyTestFirebase = {
    auth: student.auth,
    db: student.db,
  };

  const discoveryResults = await getTutors();
  assert.equal(
    discoveryResults.some((profile) => profile.id === tutor.uid),
    true,
    'student tutor-discovery query should return the approved versioned profile',
  );

  const chatResults = await waitForTutor();
  assert.equal(
    chatResults.some((profile) => profile.id === tutor.uid),
    true,
    'chat tutor query should return the approved online tutor',
  );
  assert.equal(
    chatResults.find((profile) => profile.id === tutor.uid).homeAddress,
    'EMULATOR_ONLY_PRIVATE_ADDRESS',
    'chat service passes the private field through from the Firestore document',
  );

  const rawProfile = await getDoc(doc(student.db, 'tutors', tutor.uid));
  assert.equal(rawProfile.exists(), true, 'student direct profile read should succeed');
  assert.equal(
    rawProfile.data().homeAddress,
    'EMULATOR_ONLY_PRIVATE_ADDRESS',
    'current rules allow a marked public profile to expose a legacy private field',
  );

  const mappedProfile = await getTutorById(tutor.uid);
  assert.equal(
    Object.hasOwn(mappedProfile, 'homeAddress'),
    false,
    'app mapping strips homeAddress from its returned object but not the Firestore read',
  );

  const rawQuery = query(
    collection(student.db, 'tutors'),
    where('verificationStatus', '==', 'approved'),
    where('locationPrivacyVersion', '==', 1),
    where('publicProfileVersion', '==', 2),
  );
  const rawQuerySnapshot = await getDocs(rawQuery);
  assert.equal(
    rawQuerySnapshot.docs.some((profile) =>
      Object.hasOwn(profile.data(), 'homeAddress')),
    true,
    'the discovery query returns the whole document, including private fields',
  );
});
