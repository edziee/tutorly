import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ROLES } from '../constants/roles.js';
import { hasDirectTutorAccountStatus } from '../utils/workspace.js';

test('direct tutor accounts are distinct from student tutor applicants', () => {
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'pending'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.STUDENT, 'pending'), false);
});

test('all tutor applicants see token balance only in the shared header', async () => {
  const [navigator, profile, header, indicator] = await Promise.all([
    readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/AppHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/TokenBalanceIndicator.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(navigator, /role={user\?\.role}/);
  assert.match(navigator, /<TutorStackHeader/);
  assert.match(header, /<TokenBalanceIndicator userId={userId} role={role}/);
  assert.match(indicator, /ROLES\.STUDENT, ROLES\.TUTOR, ROLES\.PROFESSIONAL/);
  assert.doesNotMatch(profile, /TokenBalanceIndicator|applicantWallet/);
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'pending'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'rejected'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.PROFESSIONAL, 'pending'), false);
  assert.equal(hasDirectTutorAccountStatus(ROLES.STUDENT, 'pending'), false);
});

test('direct tutor accounts keep the profile screen and can open the application', async () => {
  const navigator = await readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8');
  const profile = await readFile(
    new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(navigator, /if \(isDirectTutorAccount\) \{\s*setApplicationStatus\('not_submitted'\)/);
  assert.match(navigator, /shouldShowTutorTabs = canUseTutorWorkspace/);
  assert.match(navigator, /name=\{ROUTES\.TUTOR_APPLICATION\}\s+component=\{TutorApplicationScreen\}/);
  assert.match(profile, /onPress=\{\(\) => openTutorApplication\(navigation\)\}/);
  assert.match(profile, /'Complete tutor application'/);
});

test('pending tutor applications can edit rates without enabling tutor operations', async () => {
  const [profile, tutorService, rules] = await Promise.all([
    readFile(new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/tutorService.js', import.meta.url), 'utf8'),
    readFile(new URL('../../firebase-rules/firestore.rules', import.meta.url), 'utf8'),
  ]);

  assert.match(profile, /verificationStatus\)\s*&& application/);
  assert.match(profile, /title="Sign out"/);
  assert.match(tutorService, /application\.verificationStatus\)\s*\|\|\s*tutor\.verificationStatus/);
  assert.match(rules, /application\.get\('verificationStatus', ''\) in \['pending', 'approved'\]/);
  assert.match(rules, /function validBookingCreate/);
  assert.match(rules, /isApprovedTutor\(data\.tutorId\)/);
});

test('direct tutor signups are not submitted to admin review before application', async () => {
  const [admin, adminScreen, tutorProfile, userService] = await Promise.all([
    readFile(new URL('../services/adminService.js', import.meta.url), 'utf8'),
    readFile(new URL('../screens/admin/AdminVerificationsScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/userService.js', import.meta.url), 'utf8'),
  ]);

  assert.match(userService, /tutorVerificationStatus: VERIFICATION_STATUS\.PENDING/);
  const pendingSubscription = admin.match(
    /export function subscribeToPendingVerifications\([\s\S]*?export async function setVerificationStatus/,
  )?.[0];
  assert.ok(pendingSubscription, 'Expected pending verification subscription');
  assert.doesNotMatch(pendingSubscription, /COLLECTIONS\.USERS/);
  assert.doesNotMatch(adminScreen, /setDirectTutorAccountVerificationStatus|direct sign-up details/);
  assert.match(tutorProfile, /canUseTutorOperations\(\s*user\?\.role,\s*application\?\.verificationStatus/);
  assert.match(tutorProfile, /'not verified'/);
  assert.match(tutorProfile, /application\?\.verificationStatus === 'approved'/);
  assert.doesNotMatch(tutorProfile, /instantHelp|Edit times/);
  assert.match(tutorProfile, /Upcoming \(\$\{upcomingSessions\.length\}\) · Past \(\$\{completedSessions\.length\}\)/);
});

test('pending review list contains applications and legacy application profiles only', async () => {
  const adminService = await readFile(
    new URL('../services/adminService.js', import.meta.url),
    'utf8',
  );
  const pendingSubscription = adminService.match(
    /export function subscribeToPendingVerifications\([\s\S]*?export async function setVerificationStatus/,
  )?.[0];
  assert.ok(pendingSubscription, 'Expected pending verification subscription');
  assert.match(pendingSubscription, /COLLECTIONS\.TUTOR_APPLICATIONS/);
  assert.match(pendingSubscription, /COLLECTIONS\.TUTORS/);
  assert.doesNotMatch(pendingSubscription, /COLLECTIONS\.USERS/);
});
