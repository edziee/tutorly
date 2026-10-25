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
const tutorService = await readFile(
  new URL('./tutorService.js', import.meta.url),
  'utf8',
);
const userService = await readFile(
  new URL('./userService.js', import.meta.url),
  'utf8',
);
const locationService = await readFile(
  new URL('./locationService.js', import.meta.url),
  'utf8',
);
const tutorsScreen = await readFile(
  new URL('../screens/student/TutorsScreen.jsx', import.meta.url),
  'utf8',
);
const adminService = await readFile(
  new URL('./adminService.js', import.meta.url),
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
  assert.match(tutorProfile, /Your home address stays private/);
});

test('public tutor discovery accepts only coarse location cells and strips legacy exact coordinates', () => {
  const publicTutor = ruleFunction('validPublicTutor');
  assert.match(publicTutor, /'locationCell'/);
  assert.match(publicTutor, /'locationCellVersion'/);
  assert.match(publicTutor, /data\.locationCellVersion == 1 && 'locationCell' in data/);
  assert.match(publicTutor, /'locationPrivacyVersion'/);
  assert.match(ruleFunction('validTutorLocationCellUpdate'), /'location', 'locationCell'/);
  assert.doesNotMatch(publicTutor, /'coordinates'/);
  assert.doesNotMatch(publicTutor, /'homeAddress/);
  assert.match(tutorService, /where\('locationPrivacyVersion', '==', 1\)/);
  assert.match(
    rules,
    /resource\.data\.get\('locationPrivacyVersion', 0\) == 1/,
    'students and tutors cannot read legacy public profiles until cleaned',
  );
  assert.match(
    ruleFunction('validAdminLocationPrivacyCleanup'),
    /!\('coordinates' in request\.resource\.data\)/,
  );
  const adminLocationCleanup = ruleFunction('validAdminLocationPrivacyCleanup');
  assert.match(adminLocationCleanup, /'locationCellVersion'/);
  assert.match(adminLocationCleanup, /'updatedAt'/);
  assert.match(rules, /validAdminLocationPrivacyCleanup/);
  assert.match(adminService, /coordinates: deleteField\(\)/);
  assert.match(adminService, /homeAddress: deleteField\(\)/);
  assert.match(adminService, /Location\.geocodeAsync\(tutorCity\)/);
  assert.match(adminService, /locationCellVersion: 1/);
  assert.match(tutorService, /delete publicData\.coordinates/);
  assert.match(tutorService, /delete publicData\.homeAddress/);
  assert.match(
    schema,
    /\| `locationCell` \| map .*coarse.*Never publish exact coordinates or addresses/,
  );
});

test('nearby search reads only the signed-in student profile for its fallback address', () => {
  assert.match(
    locationService,
    /doc\(requireFirebase\(\)\.db, COLLECTIONS\.USERS, uid\)/,
  );
  assert.doesNotMatch(locationService, /collection\(.*COLLECTIONS\.USERS/);
  assert.match(
    locationService,
    /Student device coordinates are[\s\S]{0,60}used only in memory/,
  );
  assert.match(locationService, /geolocationConsent: consented/);
});

test('Near me tries device location before requiring a saved-address fallback', () => {
  assert.doesNotMatch(tutorsScreen, /getNearMeProfileError/);
  assert.doesNotMatch(
    locationService.slice(locationService.indexOf('export async function getStudentSearchOrigin')),
    /getNearMeProfileError/,
  );
  assert.match(
    locationService.slice(locationService.indexOf('async function getSavedAddressCoordinates')),
    /getNearMeProfileError/,
  );
  assert.match(locationService, /requestLocationPermission\(\)[\s\S]*?getCurrentCoordinates\(\)/);
  assert.match(tutorsScreen, /navigation\.navigate\(ROUTES\.PROFILE\)/);
  assert.match(tutorsScreen, /recordGeolocationConsent\(user\.uid, consented\)/);
  assert.match(tutorsScreen, />Retry<\/Text>/);
  assert.match(tutorsScreen, />Update profile<\/Text>/);
});

test('changing city invalidates its private geocode cache and public tutor cell', () => {
  assert.match(userService, /if \(locationChanged \|\| homeAddressChanged\)/);
  assert.match(userService, /import \{\s*deleteField,/);
  assert.match(userService, /safeChanges\.homeAddressCoordinates = deleteField\(\)/);
  assert.match(userService, /safeChanges\.homeAddressGeocodeKey = deleteField\(\)/);
  assert.match(userService, /safeChanges\.locationAreaCoordinates = deleteField\(\)/);
  assert.match(userService, /safeChanges\.locationAreaGeocodeKey = deleteField\(\)/);
  assert.match(userService, /locationCell: deleteField\(\)/);
  assert.match(userService, /batch\.update\(userRef, safeChanges\)[\s\S]*await batch\.commit\(\)/);
  assert.match(locationService, /Location\.geocodeAsync\(city\)/);
  const tutorLocationSync = locationService.slice(
    locationService.indexOf('export async function syncTutorApproximateLocation'),
  );
  assert.doesNotMatch(tutorLocationSync, /profile\.homeAddress/);
  assert.doesNotMatch(tutorLocationSync, /Location\.geocodeAsync\(`\$\{address\}, \$\{city\}`\)/);
  assert.match(locationService, /locationCellVersion: 1/);
  assert.match(tutorService, /if \(publicData\.locationCellVersion !== 1\) delete publicData\.locationCell/);
  assert.match(
    ruleFunction('validProfileUpdate'),
    /changes\.hasAny\(\['location', 'homeAddress'\]\)[\s\S]*homeAddressCoordinates/,
  );
  assert.match(
    ruleFunction('validProfileUpdate'),
    /changes\.hasAny\(\['location'\]\)[\s\S]*locationAreaCoordinates/,
  );
});
