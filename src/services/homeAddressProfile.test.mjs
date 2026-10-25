import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rules = await readFile(
  new URL('../../firebase-rules/firestore.rules', import.meta.url),
  'utf8',
);
const schema = await readFile(
  new URL('../../docs/FIRESTORE_SCHEMA.md', import.meta.url),
  'utf8',
);
const tutorProfile = await readFile(
  new URL('../screens/tutor/TutorWorkspaceProfileScreen.jsx', import.meta.url),
  'utf8',
);

function ruleFunction(name) {
  const match = rules.match(
    new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`),
  );
  assert.ok(match, `Expected Firestore rule function ${name}`);
  return match[1];
}

test('home addresses are allowed only as private owner profile updates', () => {
  const profileUpdate = ruleFunction('validProfileUpdate');
  assert.match(profileUpdate, /'homeAddress'/);
  assert.match(profileUpdate, /request\.resource\.data\.homeAddress is string/);
  assert.match(profileUpdate, /request\.resource\.data\.homeAddress\.size\(\) <= 300/);
  assert.match(
    rules,
    /match \/users\/\{uid\} \{\s+allow get: if authenticated\(\) && \(request\.auth\.uid == uid \|\| isAdmin\(\)\);/,
  );
  assert.match(
    rules,
    /request\.auth\.uid == uid &&\s+validProfileUpdate\(uid\)/,
  );
});

test('home addresses are not accepted on public tutor profiles', () => {
  assert.doesNotMatch(ruleFunction('validPublicTutor'), /'homeAddress'/);
  assert.match(
    schema,
    /\| `homeAddress` \| string \| Optional private home address.*never copied to the public tutor document/,
  );
});

test('tutors edit private city and home address details in a profile modal', () => {
  assert.match(tutorProfile, /Personal information/);
  assert.match(tutorProfile, /City or area/);
  assert.match(tutorProfile, /accessibilityLabel="Edit personal information"/);
  assert.match(tutorProfile, /visible=\{homeAddressEditorVisible\}/);
  assert.match(
    tutorProfile,
    /await updateProfile\(\{ location: updatedLocation, homeAddress: updatedAddress \}\)/,
  );
  assert.match(tutorProfile, /COMMON_CITY_SUGGESTIONS/);
  assert.match(tutorProfile, /No matches\. Keep typing to use your own location\./);
  assert.match(tutorProfile, /Your address is not included in your public tutor profile\./);
});
