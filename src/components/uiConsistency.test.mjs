import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

test('authenticated stack routes use the branded Tutorly header', async () => {
  const [studentNavigator, tutorNavigator, professionalNavigator, adminNavigator] = await Promise.all([
    source('../navigation/StudentNavigator.jsx'),
    source('../navigation/TutorNavigator.jsx'),
    source('../navigation/ProfessionalNavigator.jsx'),
    source('../navigation/AdminNavigator.jsx'),
  ]);

  assert.match(studentNavigator, /function StudentStackHeader/);
  assert.match(studentNavigator, /headerShown: true/);
  assert.match(tutorNavigator, /function TutorStackHeader/);
  assert.match(professionalNavigator, /function ProfessionalStackHeader/);
  assert.match(adminNavigator, /<AdminHeader/);
});

test('profile avatars share circular cover-cropped photos and fallback styling', async () => {
  const [
    avatar,
    tutorCard,
    chatScreen,
    studentProfile,
    booking,
    schedule,
    tutorSchedule,
    tutorWorkspace,
    adminUsers,
    nativeMap,
    webMap,
    webMapStyles,
  ] = await Promise.all([
    source('./StudentAvatar.jsx'),
    source('./TutorCard.jsx'),
    source('../screens/shared/ChatScreen.jsx'),
    source('../screens/student/StudentProfileScreen.jsx'),
    source('../screens/student/BookingScreen.jsx'),
    source('../screens/student/ScheduleScreen.jsx'),
    source('../screens/tutor/TutorScheduleScreen.jsx'),
    source('../screens/tutor/TutorWorkspaceProfileScreen.jsx'),
    source('../screens/admin/AdminUsersScreen.jsx'),
    source('../screens/student/TutorsMapScreen.native.jsx'),
    source('../screens/student/TutorsMapScreen.web.jsx'),
    source('../screens/student/TutorsMapScreen.web.css'),
  ]);

  assert.match(avatar, /resizeMode="cover"/);
  assert.match(avatar, /colors\.avatarBackground/);
  for (const screen of [
    tutorCard,
    chatScreen,
    studentProfile,
    booking,
    schedule,
    tutorSchedule,
    tutorWorkspace,
    adminUsers,
    nativeMap,
  ]) {
    assert.match(screen, /StudentAvatar/);
  }
  assert.match(webMap, /tutor\.photoUrl/);
  assert.match(webMapStyles, /object-fit: cover/);
});

test('token currency uses Tutorly colors in the header and wallet', async () => {
  const [indicator, wallet] = await Promise.all([
    source('./TokenBalanceIndicator.jsx'),
    source('../screens/shared/WalletScreen.jsx'),
  ]);
  const legacyTokenColors = /#(?:573A2B|A2784D|F5B72E|D99012|7A4B00)/i;

  assert.match(indicator, /backgroundColor: colors\.lavender/);
  assert.match(indicator, /backgroundColor: colors\.primary/);
  assert.doesNotMatch(indicator, legacyTokenColors);
  assert.doesNotMatch(wallet, legacyTokenColors);
});

test('approved tutor statuses use the highlighted verification badge', async () => {
  const [badge, workspace, application, reviewHistory] = await Promise.all([
    source('./VerificationBadge.jsx'),
    source('../screens/tutor/TutorWorkspaceProfileScreen.jsx'),
    source('../screens/tutor/TutorProfileScreen.jsx'),
    source('../screens/admin/AdminReviewHistoryScreen.jsx'),
  ]);

  assert.match(badge, /name="shield-checkmark"/);
  assert.match(badge, /label = 'Approved'/);
  assert.match(workspace, /<VerificationBadge/);
  assert.match(application, /<VerificationBadge/);
  assert.match(reviewHistory, /<VerificationBadge/);
});
