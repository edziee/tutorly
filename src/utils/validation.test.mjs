// Tests for validation.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validatePasswordPresent,
  validateRequired,
} from './validation.js';

test('validateEmail accepts a normal email, with spaces around it', () => {
  assert.equal(validateEmail('qjdoe@tip.edu.ph'), '');
  assert.equal(validateEmail('  qjdoe@tip.edu.ph  '), '');
});

test('validateEmail rejects empty and malformed emails with a message', () => {
  assert.notEqual(validateEmail(''), '');
  assert.notEqual(validateEmail('   '), '');
  assert.notEqual(validateEmail(undefined), '');
  assert.notEqual(validateEmail('qjdoe'), '');
  assert.notEqual(validateEmail('qjdoe@'), '');
  assert.notEqual(validateEmail('qjdoe@tip'), '');
  assert.notEqual(validateEmail('q jdoe@tip.edu.ph'), '');
});

test('validatePassword needs the minimum length', () => {
  assert.notEqual(validatePassword(''), '');
  assert.notEqual(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1)), '');
  assert.equal(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH)), '');
});

test('validatePasswordPresent only checks that something was typed', () => {
  assert.notEqual(validatePasswordPresent(''), '');
  assert.notEqual(validatePasswordPresent(undefined), '');
  assert.equal(validatePasswordPresent('abc'), '');
});

test('validateRequired names the missing field', () => {
  assert.equal(validateRequired('John Doe', 'your name'), '');
  assert.equal(validateRequired('   ', 'your name'), 'Enter your name.');
  assert.equal(validateRequired(undefined, 'your name'), 'Enter your name.');
});
