// Tests for errors.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getAuthErrorMessage, getErrorMessage } from './errors.js';

test('wrong-credential codes all give the same message, so nobody can tell if an email exists', () => {
  const message = getAuthErrorMessage({ code: 'auth/invalid-credential' });
  assert.equal(getAuthErrorMessage({ code: 'auth/wrong-password' }), message);
  assert.equal(getAuthErrorMessage({ code: 'auth/user-not-found' }), message);
});

test('known auth codes give a readable message', () => {
  assert.match(getAuthErrorMessage({ code: 'auth/email-already-in-use' }), /already exists/);
  assert.match(getAuthErrorMessage({ code: 'auth/network-request-failed' }), /internet/);
  assert.match(getAuthErrorMessage({ code: 'auth/too-many-requests' }), /Too many/);
  assert.match(getAuthErrorMessage({ code: 'auth/profile-missing' }), /couldn’t find your account details/);
  assert.match(getAuthErrorMessage({ code: 'auth/not-admin' }), /can’t access the admin area/);
  assert.match(getAuthErrorMessage({ code: 'auth/role-mismatch' }), /another role/);
});

test('unknown errors never show raw developer text to a student', () => {
  assert.equal(
    getAuthErrorMessage(new Error('Firebase: Error (auth/some-new-code).')),
    'Something went wrong. Please try again.',
  );
  assert.equal(getAuthErrorMessage(undefined), 'Something went wrong. Please try again.');
});

test('our own team messages are shown as written', () => {
  const placeholder = new Error('authService.signIn is not implemented yet (owner: Member 1).');
  const notConfigured = new Error('Firebase is not configured. Copy .env.example ...');
  assert.equal(getAuthErrorMessage(placeholder), placeholder.message);
  assert.equal(getErrorMessage(notConfigured), notConfigured.message);
});

test('getErrorMessage maps common Firestore codes and falls back to the given text', () => {
  assert.match(getErrorMessage({ code: 'permission-denied' }), /access/);
  assert.match(getErrorMessage({ code: 'unavailable' }), /internet/);
  assert.match(
    getErrorMessage({ code: 'booking/tutor-overlap' }),
    /accepted session during this time/,
  );
  assert.equal(getErrorMessage(new Error('boom'), 'Could not load users.'), 'Could not load users.');
  assert.equal(getErrorMessage(null), 'Something went wrong. Please try again.');
});
