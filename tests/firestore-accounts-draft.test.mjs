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
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  terminate,
  updateDoc,
} from 'firebase/firestore';
import { createUserProfile, getUserProfile, updateUserProfile } from '../src/services/userService.js';

const projectId = 'demo-tutorly-accounts-draft';

async function createIdentity() {
  const app = initializeApp(
    { apiKey: 'local-only-key', projectId },
    `accounts-draft-${randomUUID()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9198', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8280);
  const email = `account-${randomUUID()}@example.test`;
  const credential = await createUserWithEmailAndPassword(auth, email, randomUUID());
  return { app, auth, db, email, uid: credential.user.uid };
}

async function createProfile(identity, role = 'student') {
  globalThis.__tutorlyTestFirebase = { auth: identity.auth, db: identity.db };
  await createUserProfile(identity.uid, {
    email: identity.email,
    role,
    name: 'Test Account',
    campusId: '',
    ...(role === 'tutor' ? { tutorType: 'peer' } : {}),
  });
}

async function cleanup(identities) {
  for (const identity of identities) {
    await terminate(identity.db);
    await deleteApp(identity.app);
  }
}

test('account draft allows signup and own profile flows while protecting identity fields', async (t) => {
  const owner = await createIdentity();
  const other = await createIdentity();
  const tutor = await createIdentity();
  t.after(() => cleanup([owner, other, tutor]));

  await createProfile(owner);
  await createProfile(other);
  await createProfile(tutor, 'tutor');

  globalThis.__tutorlyTestFirebase = { auth: owner.auth, db: owner.db };
  assert.equal((await getUserProfile(owner.uid)).role, 'student');

  await updateUserProfile(owner.uid, { name: 'Updated Name' });
  await updateUserProfile(owner.uid, {
    location: 'North Campus',
    homeAddress: 'Updated Address',
  });
  await updateUserProfile(owner.uid, { studyStreakReminderEnabled: true });
  await updateUserProfile(owner.uid, { studyStreakReminderEnabled: false });
  assert.equal(
    (await getDoc(doc(owner.db, 'users', owner.uid))).data().name,
    'Updated Name',
  );
  assert.equal(
    (await getDoc(doc(owner.db, 'users', owner.uid))).data().location,
    'North Campus',
  );
  assert.equal(
    (await getDoc(doc(owner.db, 'users', owner.uid))).data().studyStreakReminderEnabled,
    false,
  );
  await assert.rejects(
    updateUserProfile(owner.uid, { studyStreakReminderEnabled: 'yes' }),
    { code: 'permission-denied' },
  );

  await assert.rejects(
    getDoc(doc(owner.db, 'users', other.uid)),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    updateDoc(doc(owner.db, 'users', other.uid), { studyStreakReminderEnabled: true }),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    updateDoc(doc(owner.db, 'users', owner.uid), { role: 'admin' }),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    setDoc(doc(owner.db, 'users', `${owner.uid}-extra`), {
      uid: `${owner.uid}-extra`,
      email: owner.email,
      role: 'admin',
      name: 'Escalated',
      campusId: '',
      createdAt: new Date(),
    }),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    deleteDoc(doc(owner.db, 'users', owner.uid)),
    { code: 'permission-denied' },
  );
});
