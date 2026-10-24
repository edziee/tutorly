import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isSupportedGoogleFormUrl } from './tokenForms.js';

test('token request links accept supported Google Forms and reject other hosts', () => {
  assert.equal(isSupportedGoogleFormUrl('https://docs.google.com/forms/d/e/example/viewform'), true);
  assert.equal(isSupportedGoogleFormUrl('https://forms.gle/example'), true);
  assert.equal(isSupportedGoogleFormUrl('http://docs.google.com/forms/example'), false);
  assert.equal(isSupportedGoogleFormUrl('https://example.com/form'), false);
  assert.equal(isSupportedGoogleFormUrl('https://docs.google.com.evil.test/forms/example'), false);
});

test('role-specific form settings are read from public Expo configuration', async () => {
  const originalStudentUrl = process.env.EXPO_PUBLIC_STUDENT_TOKEN_TOPUP_FORM_URL;
  const originalTutorUrl = process.env.EXPO_PUBLIC_TUTOR_TOKEN_CASHOUT_FORM_URL;
  process.env.EXPO_PUBLIC_STUDENT_TOKEN_TOPUP_FORM_URL = 'https://forms.gle/student';
  process.env.EXPO_PUBLIC_TUTOR_TOKEN_CASHOUT_FORM_URL = 'https://docs.google.com/forms/d/e/tutor/viewform';
  try {
    const { getTokenFormUrl } = await import(`./tokenForms.js?test=${Date.now()}`);
    assert.equal(getTokenFormUrl('student'), 'https://forms.gle/student');
    assert.equal(getTokenFormUrl('tutor'), 'https://docs.google.com/forms/d/e/tutor/viewform');
    assert.equal(getTokenFormUrl('admin'), '');
  } finally {
    if (originalStudentUrl === undefined) delete process.env.EXPO_PUBLIC_STUDENT_TOKEN_TOPUP_FORM_URL;
    else process.env.EXPO_PUBLIC_STUDENT_TOKEN_TOPUP_FORM_URL = originalStudentUrl;
    if (originalTutorUrl === undefined) delete process.env.EXPO_PUBLIC_TUTOR_TOKEN_CASHOUT_FORM_URL;
    else process.env.EXPO_PUBLIC_TUTOR_TOKEN_CASHOUT_FORM_URL = originalTutorUrl;
  }
});
