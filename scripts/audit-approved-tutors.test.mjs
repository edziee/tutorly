import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditApprovedTutor } from './audit-approved-tutors.mjs';

test('approved tutor audit flags outdated markers and legacy private fields', () => {
  const result = auditApprovedTutor('tutor-1', {
    verificationStatus: 'approved',
    publicProfileVersion: 1,
    locationPrivacyVersion: 1,
    coordinates: { latitude: 14, longitude: 121 },
    homeAddress: 'private value',
    applicationProofUrl: 'private value',
    locationAreaGeocodeKey: 'private value',
    name: 'Test tutor',
  });

  assert.equal(result.profileVersionMismatch, true);
  assert.equal(result.locationPrivacyVersionMismatch, false);
  assert.deepEqual(result.privateLocationFields, [
    'coordinates',
    'homeAddress',
    'locationAreaGeocodeKey',
  ]);
  assert.deepEqual(result.legacyApplicationFields, ['applicationProofUrl']);
  assert.deepEqual(result.otherUnsupportedFields, []);
  assert.equal(JSON.stringify(result).includes('private value'), false);
});

test('approved tutor audit returns no candidates for a current public profile shape', () => {
  const result = auditApprovedTutor('tutor-2', {
    verificationStatus: 'approved',
    publicProfileVersion: 2,
    locationPrivacyVersion: 1,
    locationCell: { latitudeCell: 1400, longitudeCell: 12100 },
    locationCellVersion: 1,
    lastSeenAt: new Date(),
    name: 'Test tutor',
    tier: 'Peer Tutor',
    subject: 'Mathematics',
  });

  assert.equal(result.profileVersionMismatch, false);
  assert.equal(result.locationPrivacyVersionMismatch, false);
  assert.deepEqual(result.privateLocationFields, []);
  assert.deepEqual(result.legacyApplicationFields, []);
  assert.deepEqual(result.otherUnsupportedFields, []);
});
