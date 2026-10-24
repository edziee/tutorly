import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ROUTES } from '../constants/routes.js';
import { openTutorApplication } from './studentNavigationActions.js';

test('student application entry points navigate to the dedicated application route', () => {
  const actions = [];
  openTutorApplication({ navigate: (route) => actions.push(route) });
  assert.deepEqual(actions, [ROUTES.TUTOR_APPLICATION]);
});

test('Profile uses the shared application navigation action', async () => {
  const profile = await readFile(
    new URL('../screens/student/StudentProfileScreen.jsx', import.meta.url),
    'utf8',
  );
  assert.match(profile, /openTutorApplication\(navigation\)/);
  assert.match(profile, /accessibilityLabel="Switch to tutor workspace"/);
  assert.match(profile, /<WorkspaceSwitchCard/);
  assert.match(profile, /title="Tutor workspace"/);
  assert.match(profile, /description="Switch modes without changing your student account\."/);
  assert.match(profile, /Next session/);
});

test('student and tutor workspace switches share the same card component', async () => {
  const [studentProfile, tutorProfile, tutorNavigator, switchCard] = await Promise.all([
    readFile(new URL('../screens/student/StudentProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/WorkspaceSwitchCard.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(studentProfile, /<WorkspaceSwitchCard/);
  assert.match(tutorProfile, /<WorkspaceSwitchCard/);
  assert.match(tutorNavigator, /<WorkspaceSwitchCard/);
  assert.match(tutorProfile, /Switch to student workspace/);
  assert.match(switchCard, /chevron-forward/);
  assert.match(switchCard, /accessibilityRole="button"/);
});

test('student navigation has four tabs and keeps student features accessible', async () => {
  const navigator = await readFile(
    new URL('./StudentNavigator.jsx', import.meta.url),
    'utf8',
  );
  for (const route of [
    'name="Tutors"',
    'name="Profile"',
    'name="Schedule"',
    'name="Chat"',
    'ROUTES.BOOKING',
    'ROUTES.PAYMENT',
  ]) {
    assert.ok(navigator.includes(route), `Expected student route ${route}`);
  }
  assert.doesNotMatch(navigator, /STUDENT_DASHBOARD|StudentDashboard/);
  assert.doesNotMatch(navigator, /name="TutorProfile"/);
  assert.match(
    navigator,
    /initialRouteName=\{studentProfileOnModeSwitch \? ROUTES\.PROFILE : ROUTES\.TUTORS\}/,
  );
  assert.equal((navigator.match(/<Tab\.Screen/g) || []).length, 6); // four tabs plus booking and payment routes
});

test('student and tutor headers open the shared wallet screen without changing account mode', async () => {
  const [studentNavigator, tutorNavigator, indicator, walletScreen] = await Promise.all([
    readFile(new URL('./StudentNavigator.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/TokenBalanceIndicator.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../screens/shared/WalletScreen.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(studentNavigator, /name=\{ROUTES\.WALLET\}\s+component=\{WalletScreen\}/);
  assert.match(tutorNavigator, /name=\{ROUTES\.WALLET\}\s+component=\{WalletScreen\}/);
  assert.match(studentNavigator, /onWalletPress=\{\(\) => navigation\.navigate\(ROUTES\.WALLET\)\}/);
  assert.match(tutorNavigator, /onWalletPress=\{\(\) => navigation\.navigate\(ROUTES\.WALLET\)\}/);
  assert.match(indicator, /onPress=\{onBalancePress\}/);
  assert.match(indicator, /onPress=\{openRequestForm\}/);
  assert.match(walletScreen, /subscribeToTokenTransactions/);
  assert.match(walletScreen, /assertApprovedTutor/);
});
