// Tests for role handling. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isTutorRole, LOGIN_ROLES, ROLES, SIGNUP_ROLES } from './roles.js';

test('new sign-ups use only the shared tutor role for tutors', () => {
  assert.deepEqual(SIGNUP_ROLES, [ROLES.STUDENT, ROLES.TUTOR]);
});

test('legacy professional accounts remain valid tutor logins', () => {
  assert.ok(LOGIN_ROLES.includes(ROLES.PROFESSIONAL));
  assert.equal(isTutorRole(ROLES.PROFESSIONAL), true);
  assert.equal(isTutorRole(ROLES.TUTOR), true);
  assert.equal(isTutorRole(ROLES.STUDENT), false);
});
