import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
} from 'firebase/firestore';

import {
  awardStudentBadge,
  setStudentBadgeVisibility,
  setTutorAchievementVisibility,
  subscribeToStudentBadgeAwards,
  subscribeToTutorBadgeAwards,
} from '../src/services/badgeService.js';
import { updateBookingStatus } from '../src/services/bookingService.js';

const projectId = 'demo-tutorly-badges';
const restRoot = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const choose = (identity) => { globalThis.__tutorlyTestFirebase = identity; };

async function seed(path, values) {
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
    typeof value === 'boolean' ? { booleanValue: value }
      : typeof value === 'number' ? { integerValue: String(value) }
        : { stringValue: value }]));
  const response = await fetch(`${restRoot}:commit`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [{
        update: {
          name: `projects/${projectId}/databases/(default)/documents/${path}`,
          fields,
        },
      }],
    }),
  });
  assert.equal(response.ok, true, await response.text());
}

async function identity(role, approvedTutor = false) {
  const app = initializeApp({ apiKey: 'local-only-key', projectId }, `${role}-${randomUUID()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `${role}-${randomUUID()}@example.test`;
  const result = await createUserWithEmailAndPassword(auth, email, randomUUID());
  const uid = result.user.uid;
  await seed(`users/${uid}`, { uid, role, name: `Test ${role}` });
  if (approvedTutor) {
    await seed(`tutors/${uid}`, {
      name: 'Test Tutor',
      verificationStatus: 'approved',
      publicProfileVersion: 2,
      totalRecordedTeachingSeconds: 0,
    });
    await seed(`tutorApplications/${uid}`, { verificationStatus: 'approved' });
  }
  return { app, auth, db, uid };
}

async function seedBooking({ bookingId, studentId, tutorId, status = 'completed', seconds = 60 }) {
  await seed(`bookings/${bookingId}`, {
    studentId,
    tutorId,
    status,
    timerStatus: 'stopped',
    accumulatedDurationSeconds: seconds,
    subject: 'Test subject',
  });
}

function firstSnapshot(subscribe, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop?.();
      reject(new Error('Listener timed out'));
    }, 10000);
    let stop;
    stop = subscribe((items) => {
      if (!predicate(items)) return;
      clearTimeout(timer);
      stop?.();
      resolve(items);
    }, (error) => {
      clearTimeout(timer);
      stop?.();
      reject(error);
    });
  });
}

async function cleanUp(identities) {
  for (const item of identities) {
    await terminate(item.db);
    await deleteApp(item.app);
  }
}

test('study streak reminder preference is student-owned and stored on the profile', async (t) => {
  const student = await identity('student');
  const tutor = await identity('tutor');
  t.after(() => cleanUp([student, tutor]));

  const studentProfile = doc(student.db, 'users', student.uid);
  await updateDoc(studentProfile, { studyStreakReminderEnabled: true });
  assert.equal((await getDoc(studentProfile)).data().studyStreakReminderEnabled, true);

  await assert.rejects(
    updateDoc(studentProfile, { studyStreakReminderEnabled: 'yes' }),
    /permission/i,
  );
  await assert.rejects(
    updateDoc(doc(tutor.db, 'users', tutor.uid), { studyStreakReminderEnabled: true }),
    /permission/i,
  );
});

test('student awards are optional, catalog-bound, tutor-authorized, and private', async (t) => {
  const student = await identity('student');
  const tutor = await identity('tutor', true);
  const otherTutor = await identity('tutor', true);
  const outsider = await identity('student');
  t.after(() => cleanUp([student, tutor, otherTutor, outsider]));

  const awardBookingId = randomUUID();
  const skippedBookingId = randomUUID();
  const pendingBookingId = randomUUID();
  const otherTutorBookingId = randomUUID();
  await seedBooking({ bookingId: awardBookingId, studentId: student.uid, tutorId: tutor.uid });
  await seedBooking({ bookingId: skippedBookingId, studentId: student.uid, tutorId: tutor.uid });
  await seedBooking({
    bookingId: pendingBookingId,
    studentId: student.uid,
    tutorId: tutor.uid,
    status: 'upcoming',
  });
  await seedBooking({
    bookingId: otherTutorBookingId,
    studentId: student.uid,
    tutorId: tutor.uid,
  });

  choose(tutor);
  await awardStudentBadge({
    bookingId: awardBookingId,
    badgeId: 'curious_mind',
    note: 'Asked thoughtful questions.',
  });
  const awardRef = doc(tutor.db, 'bookings', awardBookingId, 'badgeAwards', 'award');
  assert.deepEqual(
    (({ badgeId, bookingId, tutorId, studentId, note }) =>
      ({ badgeId, bookingId, tutorId, studentId, note }))((await getDoc(awardRef)).data()),
    {
      badgeId: 'curious_mind',
      bookingId: awardBookingId,
      tutorId: tutor.uid,
      studentId: student.uid,
      note: 'Asked thoughtful questions.',
    },
  );
  const issued = await firstSnapshot(
    (next, error) => subscribeToTutorBadgeAwards(tutor.uid, next, error),
    (items) => items.some((item) => item.bookingId === awardBookingId),
  );
  assert.equal(issued.find((item) => item.bookingId === awardBookingId).studentId, student.uid);
  await assert.rejects(setDoc(awardRef, {
    badgeId: 'prepared_learner',
    bookingId: awardBookingId,
    tutorId: tutor.uid,
    studentId: student.uid,
    createdAt: serverTimestamp(),
  }), /permission/i);
  await assert.rejects(
    awardStudentBadge({ bookingId: skippedBookingId, badgeId: 'unknown_badge' }),
    /student badge catalog/,
  );
  await assert.rejects(
    awardStudentBadge({ bookingId: pendingBookingId, badgeId: 'curious_mind' }),
    /only be given after/,
  );
  choose(otherTutor);
  await assert.rejects(
    awardStudentBadge({ bookingId: otherTutorBookingId, badgeId: 'curious_mind' }),
    /assigned tutor|permission/i,
  );
  choose(tutor);
  await assert.rejects(
    awardStudentBadge({ bookingId: awardBookingId, badgeId: 'curious_mind' }),
    /already been given/,
  );
  await assert.rejects(
    awardStudentBadge({
      bookingId: skippedBookingId,
      badgeId: 'curious_mind',
      note: 'x'.repeat(281),
    }),
    /280 characters/,
  );
  assert.equal(
    (await getDoc(doc(tutor.db, 'bookings', skippedBookingId, 'badgeAwards', 'award'))).exists(),
    false,
    'skipping leaves no award record',
  );

  choose(student);
  const received = await firstSnapshot(
    (next, error) => subscribeToStudentBadgeAwards(student.uid, next, error),
    (items) => items.some((item) => item.bookingId === awardBookingId),
  );
  assert.equal(received.find((item) => item.bookingId === awardBookingId).studentId, student.uid);
  choose(outsider);
  await assert.rejects(
    getDoc(doc(outsider.db, 'bookings', awardBookingId, 'badgeAwards', 'award')),
    /permission/i,
  );

  choose(otherTutor);
  await assert.rejects(setDoc(
    doc(otherTutor.db, 'bookings', otherTutorBookingId, 'badgeAwards', 'award'),
    {
      badgeId: 'curious_mind',
      bookingId: otherTutorBookingId,
      tutorId: otherTutor.uid,
      studentId: student.uid,
      createdAt: serverTimestamp(),
    },
  ), /permission/i);

  choose(tutor);
  await assert.rejects(setDoc(
    doc(tutor.db, 'bookings', pendingBookingId, 'badgeAwards', 'award'),
    {
      badgeId: 'curious_mind',
      bookingId: pendingBookingId,
      tutorId: tutor.uid,
      studentId: student.uid,
      createdAt: serverTimestamp(),
    },
  ), /permission/i);
  await assert.rejects(setDoc(
    doc(tutor.db, 'bookings', skippedBookingId, 'badgeAwards', 'award'),
    {
      badgeId: 'not_in_catalog',
      bookingId: skippedBookingId,
      tutorId: tutor.uid,
      studentId: student.uid,
      createdAt: serverTimestamp(),
    },
  ), /permission/i);
  await assert.rejects(setDoc(
    doc(tutor.db, 'bookings', skippedBookingId, 'badgeAwards', 'award'),
    {
      badgeId: 'curious_mind',
      bookingId: skippedBookingId,
      tutorId: tutor.uid,
      studentId: student.uid,
      note: 'x'.repeat(281),
      createdAt: serverTimestamp(),
    },
  ), /permission/i);
});

test('badge visibility only changes a received award and cannot expose another student’s record', async (t) => {
  const student = await identity('student');
  const otherStudent = await identity('student');
  const tutor = await identity('tutor', true);
  const bookingId = randomUUID();
  const unearnedBookingId = randomUUID();
  await seedBooking({ bookingId, studentId: student.uid, tutorId: tutor.uid });
  await seedBooking({
    bookingId: unearnedBookingId,
    studentId: student.uid,
    tutorId: tutor.uid,
  });
  t.after(() => cleanUp([student, otherStudent, tutor]));

  choose(tutor);
  await awardStudentBadge({ bookingId, badgeId: 'prepared_learner' });
  choose(student);
  await setStudentBadgeVisibility(bookingId, false);
  const visibilityRef = doc(student.db, 'users', student.uid, 'studentBadgeVisibility', bookingId);
  assert.equal((await getDoc(visibilityRef)).data().visible, false);
  await setStudentBadgeVisibility(bookingId, true);
  assert.equal((await getDoc(visibilityRef)).data().visible, true);
  await assert.rejects(
    setStudentBadgeVisibility(unearnedBookingId, true),
    /badge you received/,
  );
  await assert.rejects(setDoc(
    doc(student.db, 'users', student.uid, 'studentBadgeVisibility', unearnedBookingId),
    { visible: true, updatedAt: serverTimestamp() },
  ), /permission/i);

  choose(otherStudent);
  await assert.rejects(
    getDoc(doc(otherStudent.db, 'users', student.uid, 'studentBadgeVisibility', bookingId)),
    /permission/i,
  );
  await assert.rejects(setDoc(
    doc(otherStudent.db, 'users', otherStudent.uid, 'studentBadgeVisibility', unearnedBookingId),
    { visible: true, updatedAt: serverTimestamp() },
  ), /permission/i);

  choose(student);
  assert.equal(
    (await getDoc(doc(student.db, 'bookings', bookingId, 'badgeAwards', 'award'))).exists(),
    true,
    'hiding/showing leaves the original award intact',
  );
});

test('tutor achievements are created only at verified thresholds and remain private', async (t) => {
  const testCases = [
    { previousBookings: 0, previousSeconds: 0, seconds: 60, expected: 'first_lesson' },
    { previousBookings: 9, previousSeconds: 600, seconds: 60, expected: 'steady_mentor' },
    { previousBookings: 24, previousSeconds: 1800, seconds: 60, expected: 'experienced_guide' },
    { previousBookings: 2, previousSeconds: 35950, seconds: 60, expected: 'hours_of_impact' },
    { previousBookings: 3, previousSeconds: 36000, seconds: 60, expected: 'hours_of_impact' },
  ];
  const identities = [];
  t.after(() => cleanUp(identities));

  for (const item of testCases) {
    const tutor = await identity('tutor', true);
    identities.push(tutor);
    const bookingId = randomUUID();
    await seed(`users/${tutor.uid}`, {
      uid: tutor.uid,
      role: 'tutor',
      name: 'Test Tutor',
      tutorCompletedBookingCount: item.previousBookings,
    });
    await seed(`tutors/${tutor.uid}`, {
      name: 'Test Tutor',
      verificationStatus: 'approved',
      publicProfileVersion: 2,
      totalRecordedTeachingSeconds: item.previousSeconds,
    });
    await seedBooking({
      bookingId,
      studentId: randomUUID(),
      tutorId: tutor.uid,
      status: 'upcoming',
      seconds: item.seconds,
    });
    choose(tutor);
    await updateBookingStatus(bookingId, 'completed');
    const achievementRef = doc(
      tutor.db,
      'tutorAchievements',
      `${tutor.uid}_${item.expected}`,
    );
    const achievement = await getDoc(achievementRef);
    assert.equal(achievement.exists(), true, `${item.expected} is issued at its threshold`);
    assert.equal(achievement.data().qualifyingBookingId, bookingId);
    assert.equal(achievement.data().criterionVersion, 1);
    await assert.rejects(setDoc(achievementRef, achievement.data()), /permission/i);
    await assert.rejects(setTutorAchievementVisibility(
      `unearned_${item.expected}`,
      true,
    ), /achievement you earned/);
    await setTutorAchievementVisibility(item.expected, false);
    const visibilityRef = doc(
      tutor.db,
      'users',
      tutor.uid,
      'tutorAchievementVisibility',
      item.expected,
    );
    assert.equal((await getDoc(visibilityRef)).data().visible, false);
    await setTutorAchievementVisibility(item.expected, true);
    assert.equal((await getDoc(visibilityRef)).data().visible, true);
  }

  const outsider = await identity('tutor', true);
  identities.push(outsider);
  const owner = identities[0];
  choose(outsider);
  await assert.rejects(
    getDoc(doc(outsider.db, 'tutorAchievements', `${owner.uid}_first_lesson`)),
    /permission/i,
  );
  await assert.rejects(updateDoc(doc(outsider.db, 'users', outsider.uid), {
    tutorCompletedBookingCount: 1,
    lastTutorCompletedBookingId: randomUUID(),
  }), /permission/i);
  await assert.rejects(setDoc(
    doc(outsider.db, 'tutorAchievements', `${outsider.uid}_steady_mentor`),
    {
      badgeId: 'steady_mentor',
      tutorId: outsider.uid,
      qualifyingBookingId: randomUUID(),
      criterionVersion: 1,
      createdAt: serverTimestamp(),
    },
  ), /permission/i);

});
