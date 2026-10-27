import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adminNavigator = await readFile(new URL('./AdminNavigator.jsx', import.meta.url), 'utf8');
const tutorNavigator = await readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8');

test('admin verification and wallet tabs have a dashboard return action', () => {
  assert.match(adminNavigator, /route\.name === ROUTES\.ADMIN_VERIFICATIONS \|\| route\.name === ROUTES\.ADMIN_WALLETS/);
  assert.match(adminNavigator, /navigation\.navigate\(ROUTES\.ADMIN_DASHBOARD\)/);
});

test('tutor bottom tabs use readable labels with word spacing', () => {
  assert.match(tutorNavigator, /tabBarLabel: 'Tutor Profile'/);
  assert.match(tutorNavigator, /tabBarLabel: 'Tutor Schedule'/);
  assert.match(tutorNavigator, /tabBarLabel: 'Tutor Chat'/);
});
