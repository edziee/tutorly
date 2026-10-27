import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('sign-up creates only student or professional-path tutor accounts', async () => {
  const signUp = await readFile(new URL('./SignUpScreen.jsx', import.meta.url), 'utf8');

  assert.match(signUp, /tutorType: TUTOR_TYPES\.PROFESSIONAL/);
  assert.doesNotMatch(signUp, /Peer Tutor|tutorKindOptions|TUTOR_TYPES\.PEER/);
});

test('sign-in keeps one Tutor portal for existing tutor account types', async () => {
  const [login, roles] = await Promise.all([
    readFile(new URL('./LoginScreen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../constants/roles.js', import.meta.url), 'utf8'),
  ]);

  assert.match(login, /title="Tutor"/);
  assert.match(login, /role: portal/);
  assert.match(login, /including peer tutors/);
  assert.match(roles, /portal === ROLES\.TUTOR && isTutorRole\(role\)/);
});

test('admin sign-in starts with a hidden password and offers an accessible visibility toggle', async () => {
  const adminLogin = await readFile(new URL('./AdminLoginScreen.jsx', import.meta.url), 'utf8');

  assert.match(adminLogin, /const \[passwordVisible, setPasswordVisible\] = useState\(false\)/);
  assert.match(adminLogin, /secureTextEntry=\{!passwordVisible\}/);
  assert.match(adminLogin, /accessibilityLabel=\{passwordVisible \? 'Hide password' : 'Show password'\}/);
});
