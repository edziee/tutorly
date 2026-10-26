import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const applicationScreen = await readFile(new URL('./TutorProfileScreen.jsx', import.meta.url), 'utf8');

test('student applicants cannot choose an Alumni or Professor category', () => {
  assert.match(applicationScreen, /const isStudentApplicant = user\?\.role === ROLES\.STUDENT/);
  assert.match(applicationScreen, /setNeedsTutorTypeChoice\(!isStudentApplicant && !savedTutorType\)/);
  assert.match(applicationScreen, /const applicationTutorType = isStudentApplicant \? TUTOR_TYPES\.PEER : tutorType/);
  assert.match(applicationScreen, /const applicationTier = isStudentApplicant \? TUTOR_TIERS\.PEER : tier/);
  assert.match(applicationScreen, /Student applications are for Peer Tutors\./);
});
