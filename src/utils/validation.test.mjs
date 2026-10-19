// Tests for validation.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validatePasswordPresent,
  validateRequired,
  isEligibleTutorGrade,
  getTutorCourseValidationError,
  getTutorApplicationEvidenceError,
  isGoogleDriveUrl,
  isHttpsUrl,
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

test('isEligibleTutorGrade accepts grades from 1.00 through 1.50', () => {
  assert.equal(isEligibleTutorGrade('1.00'), true);
  assert.equal(isEligibleTutorGrade('1.25'), true);
  assert.equal(isEligibleTutorGrade('1.50'), true);
  assert.equal(isEligibleTutorGrade(' 1.5 '), true);
});

test('isEligibleTutorGrade rejects grades above the cutoff and invalid values', () => {
  assert.equal(isEligibleTutorGrade('1.51'), false);
  assert.equal(isEligibleTutorGrade('1.75'), false);
  assert.equal(isEligibleTutorGrade('2.00'), false);
  assert.equal(isEligibleTutorGrade('0.75'), false);
  assert.equal(isEligibleTutorGrade(''), false);
  assert.equal(isEligibleTutorGrade('abc'), false);
  assert.equal(isEligibleTutorGrade('1.5.0'), false);
});

test('peer course proof requires an eligible grade and its own Drive link', () => {
  const course = {
    id: 'course-1',
    code: 'CS101',
    title: 'Programming',
    grade: '1.50',
    proofName: 'Transcript',
    proofUrl: 'https://drive.google.com/file/d/proof/view',
  };
  assert.equal(getTutorCourseValidationError('peer', course), '');
  assert.match(
    getTutorCourseValidationError('peer', { ...course, grade: '1.75' }),
    /grade from 1\.00 to 1\.50/,
  );
  assert.match(
    getTutorCourseValidationError('peer', { ...course, proofUrl: '' }),
    /sharing link/,
  );
});

test('professional course grades are optional and proof is application-level', () => {
  const application = {
    tutorType: 'professional',
    tier: 'Alumni',
    courses: [{ id: 'course-1', code: 'CS101', title: 'Programming', grade: '' }],
    applicationProofName: 'Employment certificate',
    applicationProofUrl: 'https://drive.google.com/file/d/proof/view',
  };
  assert.equal(getTutorCourseValidationError('professional', application.courses[0]), '');
  assert.equal(
    getTutorCourseValidationError('professional', { ...application.courses[0], grade: '2.00' }),
    '',
  );
  assert.equal(getTutorApplicationEvidenceError(application), '');
  assert.match(
    getTutorApplicationEvidenceError({ ...application, applicationProofUrl: '' }),
    /Google Drive or Docs link/,
  );
  assert.match(
    getTutorApplicationEvidenceError({ ...application, courses: [] }),
    /at least one course/,
  );
});

test('isGoogleDriveUrl accepts HTTPS links on Google Drive and Docs hosts only', () => {
  assert.equal(isGoogleDriveUrl('https://drive.google.com/file/d/abc/view'), true);
  assert.equal(isGoogleDriveUrl('https://docs.google.com/document/d/abc/edit'), true);
  assert.equal(isGoogleDriveUrl('http://drive.google.com/file/d/abc/view'), false);
  assert.equal(isGoogleDriveUrl('https://drive.google.com.evil.example/file/d/abc'), false);
  assert.equal(isGoogleDriveUrl('https://example.com/file/d/abc'), false);
  assert.equal(isGoogleDriveUrl('not a url'), false);
  assert.equal(isGoogleDriveUrl('https://drive.google.com'), false);
});

test('isHttpsUrl accepts HTTPS URLs and rejects non-HTTPS or malformed values', () => {
  assert.equal(isHttpsUrl('https://images.example.com/photo.jpg'), true);
  assert.equal(isHttpsUrl('http://images.example.com/photo.jpg'), false);
  assert.equal(isHttpsUrl('file:///photo.jpg'), false);
  assert.equal(isHttpsUrl(''), false);
});
