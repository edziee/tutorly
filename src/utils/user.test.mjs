// Tests for user.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getFirstName, getUserId } from './user.js';

test('getUserId reads uid, then id, and gives null when there is no user', () => {
  assert.equal(getUserId({ uid: 'u1', id: 'x' }), 'u1');
  assert.equal(getUserId({ id: 'x' }), 'x');
  assert.equal(getUserId({}), null);
  assert.equal(getUserId(null), null);
  assert.equal(getUserId(undefined), null);
});

test('getFirstName takes the first word of the name', () => {
  assert.equal(getFirstName({ name: 'Juan Dela Cruz' }), 'Juan');
  assert.equal(getFirstName({ name: '  Maria  ' }), 'Maria');
});

test('getFirstName gives "" when the name is missing', () => {
  assert.equal(getFirstName({}), '');
  assert.equal(getFirstName(null), '');
  assert.equal(getFirstName({ name: 42 }), '');
});
