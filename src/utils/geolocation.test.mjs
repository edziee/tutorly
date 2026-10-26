import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  coordinatesFromLocationCell,
  formatApproximateDistance,
  getDevicePositionIssue,
  geocodeKeyForAddress,
  geocodeKeyForLocationArea,
  getLocationFallbackReason,
  getLocationFallbackNotice,
  getNearMeProfileError,
  toLocationCell,
} from './geolocation.js';

test('Near me requires city and home address without making either generally required', () => {
  assert.match(getNearMeProfileError({}), /city or area/);
  assert.match(getNearMeProfileError({ location: 'Manila' }), /home address/);
  assert.equal(
    getNearMeProfileError({ location: 'Manila', homeAddress: 'Unit 1' }),
    '',
  );
});

test('address cache keys normalize city and address text', () => {
  assert.equal(
    geocodeKeyForAddress('  Quezon  City ', '  12   Main Street '),
    'quezon city|12 main street',
  );
});

test('city or area geocode cache keys do not include a home address', () => {
  assert.equal(geocodeKeyForLocationArea('  Quezon   City  '), 'quezon city');
});

test('public location cells are rounded integer grid indices', () => {
  const cell = toLocationCell({ latitude: 14.5995, longitude: 120.9842 });
  assert.deepEqual(cell, { latitudeCell: 1460, longitudeCell: 12098 });
  assert.deepEqual(coordinatesFromLocationCell(cell), {
    latitude: 14.6,
    longitude: 120.98,
  });
});

test('invalid or more precise public location cells are rejected', () => {
  assert.equal(toLocationCell({ latitude: 91, longitude: 0 }), null);
  assert.equal(coordinatesFromLocationCell({ latitudeCell: 1.2, longitudeCell: 3 }), null);
  assert.equal(coordinatesFromLocationCell({ latitudeCell: 9001, longitudeCell: 0 }), null);
});

test('device locations must be accurate within 1 km and no older than 2 minutes', () => {
  const now = 1_800_000_000_000;
  const position = {
    coords: { latitude: 14.6, longitude: 121, accuracy: 500 },
    timestamp: now - 60_000,
  };

  assert.equal(getDevicePositionIssue(position, now), '');
  assert.equal(
    getDevicePositionIssue({
      ...position,
      coords: { ...position.coords, accuracy: 1000 },
    }, now),
    '',
  );
  assert.equal(
    getDevicePositionIssue({ ...position, timestamp: now - 120_000 }, now),
    '',
  );
  assert.equal(
    getDevicePositionIssue({
      ...position,
      coords: { ...position.coords, accuracy: 1001 },
    }, now),
    'position-inaccurate',
  );
  assert.equal(
    getDevicePositionIssue({
      ...position,
      coords: { ...position.coords, accuracy: null },
    }, now),
    'position-inaccurate',
  );
  assert.equal(
    getDevicePositionIssue({ ...position, timestamp: now - 120_001 }, now),
    'position-stale',
  );
  assert.equal(getDevicePositionIssue({ ...position, timestamp: now + 1 }, now), 'position-stale');
  assert.equal(
    getDevicePositionIssue({
      ...position,
      coords: { ...position.coords, latitude: 91 },
    }, now),
    'position-unavailable',
  );
});

test('approximate distances use meters below one kilometer and kilometers otherwise', () => {
  assert.equal(formatApproximateDistance(0.46), '~500 m');
  assert.equal(formatApproximateDistance(0.99), '~1.0 km');
  assert.equal(formatApproximateDistance(1.24), '~1.2 km');
  assert.equal(formatApproximateDistance(10.4), '~10 km');
  assert.equal(formatApproximateDistance(null), '');
  assert.equal(formatApproximateDistance(-1), '');
});

test('permission and device-service fallback states explain the saved-address fallback', () => {
  assert.equal(
    getLocationFallbackReason({ permissionState: 'denied' }),
    'permission-denied',
  );
  assert.equal(
    getLocationFallbackReason({
      permissionState: 'granted',
      servicesEnabled: false,
    }),
    'services-disabled',
  );
  assert.equal(
    getLocationFallbackReason({
      permissionState: 'granted',
      servicesEnabled: true,
      positionAvailable: false,
    }),
    'position-unavailable',
  );
  assert.equal(
    getLocationFallbackReason({
      permissionState: 'granted',
      servicesEnabled: true,
      positionIssue: 'permission-denied',
      positionAvailable: false,
    }),
    'permission-denied',
  );
  assert.equal(
    getLocationFallbackReason({
      permissionState: 'granted',
      servicesEnabled: true,
      positionIssue: 'position-inaccurate',
      positionAvailable: false,
    }),
    'position-inaccurate',
  );
  assert.equal(
    getLocationFallbackReason({
      permissionState: 'granted',
      servicesEnabled: true,
      positionIssue: 'position-stale',
      positionAvailable: false,
    }),
    'position-stale',
  );
  assert.equal(
    getLocationFallbackReason({ permissionState: 'error' }),
    'permission-error',
  );
  assert.match(getLocationFallbackNotice('permission-denied'), /permission was denied/i);
  assert.match(getLocationFallbackNotice('services-disabled'), /services are turned off/i);
  assert.match(getLocationFallbackNotice('position-unavailable'), /unavailable right now/i);
  assert.match(getLocationFallbackNotice('position-inaccurate'), /too imprecise/i);
  assert.match(getLocationFallbackNotice('position-stale'), /out of date/i);
});
