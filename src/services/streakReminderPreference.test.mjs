import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rules = await readFile(
  new URL('../../firebase-rules/firestore.rules', import.meta.url),
  'utf8',
);
const schema = await readFile(
  new URL('../../docs/FIRESTORE_SCHEMA.md', import.meta.url),
  'utf8',
);
const profileScreen = await readFile(
  new URL('../screens/student/StudentProfileScreen.jsx', import.meta.url),
  'utf8',
);
const streakService = await readFile(new URL('./streakService.js', import.meta.url), 'utf8');

function ruleFunction(name) {
  const match = rules.match(
    new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`),
  );
  assert.ok(match, `Expected Firestore rule function ${name}`);
  return match[1];
}

test('Firestore only allows student owners to update a boolean streak reminder preference', () => {
  const profileUpdate = ruleFunction('validProfileUpdate');
  assert.match(profileUpdate, /'studyStreakReminderEnabled'/);
  assert.match(
    profileUpdate,
    /changes\.hasAny\(\['studyStreakReminderEnabled'\]\)[\s\S]*?resource\.data\.get\('role', ''\) == 'student'[\s\S]*?request\.resource\.data\.studyStreakReminderEnabled is bool/,
  );
  assert.match(
    rules,
    /request\.auth\.uid == uid &&\s+validProfileUpdate\(uid\)/,
  );
});

test('student profile persists the shared preference and syncs device-local reminders', () => {
  assert.match(profileScreen, /user\?\.studyStreakReminderEnabled/);
  assert.match(profileScreen, /updateProfile\(\{ studyStreakReminderEnabled: true \}\)/);
  assert.match(profileScreen, /updateProfile\(\{ studyStreakReminderEnabled: false \}\)/);
  assert.match(profileScreen, /enableStudentStreakReminder\(userId, \{ requestPermission: false \}\)/);
  assert.match(profileScreen, /disableStudentStreakReminder\(userId\)/);
  assert.match(streakService, /reminderNotificationId: notificationId/);
  assert.match(schema, /`studyStreakReminderEnabled` \| boolean \| Student-owned account preference, synced across devices/);
  assert.match(schema, /scheduled notification ID remains on-device/);
});
