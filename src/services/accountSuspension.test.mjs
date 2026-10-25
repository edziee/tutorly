import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rules = await readFile(
  new URL('../../firebase-rules/firestore.rules', import.meta.url),
  'utf8',
);
const authService = await readFile(
  new URL('./authService.js', import.meta.url),
  'utf8',
);
const adminUsersScreen = await readFile(
  new URL('../screens/admin/AdminUsersScreen.jsx', import.meta.url),
  'utf8',
);
const appNavigator = await readFile(
  new URL('../navigation/AppNavigator.jsx', import.meta.url),
  'utf8',
);

function ruleFunction(name) {
  const match = rules.match(
    new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`),
  );
  assert.ok(match, `Expected Firestore rule function ${name}`);
  return match[1];
}

test('Firestore blocks suspended accounts while allowing them to read their own status', () => {
  assert.match(ruleFunction('signedIn'), /accountStatus', 'active'/);
  assert.match(ruleFunction('signedIn'), /== 'active'/);
  assert.match(
    rules,
    /allow get: if authenticated\(\) && \(request\.auth\.uid == uid \|\| isAdmin\(\)\);/,
  );
});

test('only an admin can change a non-admin user account status', () => {
  const statusChange = ruleFunction('validAdminAccountStatusChange');
  assert.match(statusChange, /isAdmin\(\)/);
  assert.match(statusChange, /request\.auth\.uid != uid/);
  assert.match(statusChange, /resource\.data\.get\('role', ''\) != 'admin'/);
  assert.match(statusChange, /accountStatusUpdatedAt == request\.time/);
  assert.match(statusChange, /accountStatusUpdatedBy == request\.auth\.uid/);
  assert.match(statusChange, /'accountStatus',\s+'accountStatusUpdatedAt',\s+'accountStatusUpdatedBy'/);
});

test('sign-in and app navigation enforce suspended status with a clear confirmation flow', () => {
  assert.match(authService, /profile\.accountStatus === USER_ACCOUNT_STATUS\.SUSPENDED/);
  assert.match(appNavigator, /user\.accountStatus === USER_ACCOUNT_STATUS\.SUSPENDED/);
  assert.match(adminUsersScreen, /Suspend this account\?/);
  assert.match(adminUsersScreen, /Reactivate this account\?/);
  assert.match(adminUsersScreen, /bookings, chats, and account history will remain saved/);
});
