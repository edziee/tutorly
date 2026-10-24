import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rules = await readFile(
  new URL('../../firebase-rules/firestore.rules', import.meta.url),
  'utf8',
);

function ruleFunction(name) {
  const match = rules.match(
    new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`),
  );
  assert.ok(match, `Expected Firestore rule function ${name}`);
  return match[1];
}

test('tutor operations require an approved private application and public profile', () => {
  const approvedTutor = ruleFunction('isApprovedTutor');
  assert.match(approvedTutor, /applicationPath\(uid\)/);
  assert.match(approvedTutor, /get\(applicationPath\(uid\)\)\.data\.get\('verificationStatus', ''\) == 'approved'/);
  assert.match(approvedTutor, /get\(tutorPath\(uid\)\)\.data\.get\('verificationStatus', ''\) == 'approved'/);
  assert.match(ruleFunction('isBookingTutor'), /isApprovedTutor\(request\.auth\.uid\)/);
  assert.match(ruleFunction('validBookingCreate'), /isApprovedTutor\(data\.tutorId\)/);
});

test('student applicants may write only their own pending application', () => {
  assert.match(ruleFunction('isTutorApplicationOwner'), /request\.auth\.uid == uid/);
  assert.match(ruleFunction('isTutorApplicationOwner'), /isStudent\(\) && tutorType in \['peer', 'professional'\]/);
  assert.match(ruleFunction('validTutorApplicationCreate'), /verificationStatus == 'pending'/);
  assert.match(ruleFunction('validTutorApplicationUpdate'), /resource\.data\.verificationStatus in \['pending', 'rejected'\]/);
});

test('application review is admin-only and self-review is denied', () => {
  for (const name of [
    'validAdminTutorReview',
    'validAdminApplicationCreate',
    'validAdminApplicationUpdate',
  ]) {
    const body = ruleFunction(name);
    assert.match(body, /isAdmin\(\)/);
    assert.match(body, /request\.auth\.uid != uid/);
  }
});

test('private application evidence is owner/admin-only and excluded from public profiles', () => {
  assert.match(
    rules,
    /match \/tutorApplications\/\{uid\} \{\s+allow get: if isAdmin\(\) \|\| \(signedIn\(\) && request\.auth\.uid == uid\);\s+allow list: if isAdmin\(\);/,
  );
  const publicProfile = ruleFunction('validPublicTutor');
  assert.match(publicProfile, /!\('courses' in data\)/);
  assert.match(publicProfile, /!\('applicationProofName' in data\)/);
  assert.match(publicProfile, /!\('applicationProofUrl' in data\)/);
  assert.match(publicProfile, /!\('paymentQrUrl' in data\)/);
});
