import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ROLES } from '../constants/roles.js';
import { hasDirectTutorAccountStatus } from '../utils/workspace.js';

test('direct tutor accounts are distinct from student tutor applicants', () => {
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'pending'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.STUDENT, 'pending'), false);
});

test('direct tutor accounts bypass the applicant screen without application access', async () => {
  const navigator = await readFile(new URL('./TutorNavigator.jsx', import.meta.url), 'utf8');
  const profile = await readFile(
    new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url),
    'utf8',
  );

  assert.match(navigator, /if \(isDirectTutorAccount\) \{\s*setApplicationStatus\('not_submitted'\)/);
  assert.match(navigator, /shouldShowTutorTabs = canUseTutorWorkspace \|\| isDirectTutorAccount/);
  assert.match(navigator, /!isDirectTutorAccount \? \(/);
  assert.match(profile, /!isDirectTutorAccount \? \(\s*<Pressable/);
  assert.match(profile, /!isDirectTutorAccount \? \(\s*<AppButton/);
});

test('direct tutor admin review receives signup-only data and does not enable tutor operations', async () => {
  const [admin, adminScreen, tutorProfile, userService] = await Promise.all([
    readFile(new URL('../services/adminService.js', import.meta.url), 'utf8'),
    readFile(new URL('../screens/admin/AdminVerificationsScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/userService.js', import.meta.url), 'utf8'),
  ]);

  assert.match(userService, /tutorVerificationStatus: VERIFICATION_STATUS\.PENDING/);
  assert.match(admin, /where\('tutorVerificationStatus', '==', VERIFICATION_STATUS\.PENDING\)/);
  assert.match(adminScreen, /setDirectTutorAccountVerificationStatus/);
  assert.match(adminScreen, /No tutor courses or verification evidence were submitted at sign-up/);
  assert.match(tutorProfile, /canUseTutorOperations\(\s*user\?\.role,\s*application\?\.verificationStatus/);
  assert.match(tutorProfile, /'not verified'/);
  assert.match(tutorProfile, /application\?\.verificationStatus === 'approved'/);
  assert.doesNotMatch(tutorProfile, /instantHelp|Edit times/);
  assert.match(tutorProfile, /Upcoming \(\$\{upcomingSessions\.length\}\) · Past \(\$\{completedSessions\.length\}\)/);
});
