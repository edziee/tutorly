import { randomUUID } from 'node:crypto';

const projectId = 'demo-tutorly-badges';
const authBase = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const testPassword = 'BadgeTest123!';
const bookingId = 'badge-demo-session';
const emailByRole = {
  tutor: 'badge-tutor@example.test',
  student: 'badge-student@example.test',
};

async function createOrReuseAuthUser(email) {
  const signUpResponse = await fetch(
    `${authBase}/accounts:signUp?key=local-only-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: testPassword,
        returnSecureToken: true,
      }),
    },
  );
  if (signUpResponse.ok) return (await signUpResponse.json()).localId;

  const signInResponse = await fetch(
    `${authBase}/accounts:signInWithPassword?key=local-only-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: testPassword,
        returnSecureToken: true,
      }),
    },
  );
  if (!signInResponse.ok) {
    throw new Error(
      `Could not create or sign in ${email}: ${await signInResponse.text()}`,
    );
  }
  return (await signInResponse.json()).localId;
}

function encodeFirestoreValue(value) {
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
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)]),
      ),
    },
  };
}

async function writeDocument(path, data) {
  const response = await fetch(`${firestoreBase}:commit`, {
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
            Object.entries(data).map(([key, value]) => [key, encodeFirestoreValue(value)]),
          ),
        },
      }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Could not seed ${path}: ${await response.text()}`);
  }
}

async function deleteDocument(path) {
  const response = await fetch(`${firestoreBase}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer owner' },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Could not reset ${path}: ${await response.text()}`);
  }
}

async function main() {
  const [tutorId, studentId] = await Promise.all([
    createOrReuseAuthUser(emailByRole.tutor),
    createOrReuseAuthUser(emailByRole.student),
  ]);
  const now = new Date();
  const dateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  await Promise.all([
    writeDocument(`users/${tutorId}`, {
      uid: tutorId,
      email: emailByRole.tutor,
      role: 'tutor',
      tutorType: 'peer',
      tutorVerificationStatus: 'approved',
      name: 'Badge Demo Tutor',
      tutorCompletedBookingCount: 0,
    }),
    writeDocument(`users/${studentId}`, {
      uid: studentId,
      email: emailByRole.student,
      role: 'student',
      name: 'Badge Demo Student',
    }),
    writeDocument(`tutors/${tutorId}`, {
      name: 'Badge Demo Tutor',
      tier: 'Peer Tutor',
      tutorType: 'peer',
      verificationStatus: 'approved',
      publicProfileVersion: 2,
      totalRecordedTeachingSeconds: 0,
      rating: 0,
      reviewCount: 0,
      hourlyRate: 250,
      courseNames: 'MATH 003: Number theory',
      preferredDays: ['Today'],
      preferredTimeSlots: ['11:00 PM - 11:59 PM'],
      availability: [],
      formats: ['online'],
    }),
    writeDocument(`tutorApplications/${tutorId}`, {
      name: 'Badge Demo Tutor',
      tutorType: 'peer',
      tier: 'Peer Tutor',
      verificationStatus: 'approved',
      courses: [{ code: 'MATH 003', title: 'Number theory' }],
      preferredDays: ['Today'],
      preferredTimeSlots: ['11:00 PM - 11:59 PM'],
      availability: [],
    }),
    writeDocument(`bookings/${bookingId}`, {
      studentId,
      tutorId,
      studentName: 'Badge Demo Student',
      tutorName: 'Badge Demo Tutor',
      subject: 'MATH 003: Number theory',
      dateKey,
      startTime: '11:00 PM',
      endTime: '11:59 PM',
      durationHours: 1,
      location: 'Online',
      sessionMode: 'online',
      tokenAmountUnits: 25000,
      timerStatus: 'stopped',
      accumulatedDurationSeconds: 36000,
      status: 'upcoming',
      createdAt: now,
      updatedAt: now,
    }),
  ]);

  const achievementIds = [
    'first_lesson',
    'steady_mentor',
    'experienced_guide',
    'hours_of_impact',
  ];
  await Promise.all([
    deleteDocument(`bookings/${bookingId}/badgeAwards/award`),
    deleteDocument(`users/${studentId}/studentBadgeVisibility/${bookingId}`),
    ...achievementIds.flatMap((badgeId) => [
      deleteDocument(`tutorAchievements/${tutorId}_${badgeId}`),
      deleteDocument(`users/${tutorId}/tutorAchievementVisibility/${badgeId}`),
    ]),
  ]);

  console.log('Badge demo data is ready in the local emulators only.');
  console.log(`Tutor:   ${emailByRole.tutor} / ${testPassword}`);
  console.log(`Student: ${emailByRole.student} / ${testPassword}`);
  console.log(`Test booking: ${bookingId} (today, 11:00 PM)`);
  console.log('The test booking is preloaded with 10 recorded hours to exercise Hours of Impact.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
