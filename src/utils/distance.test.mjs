// Tests for distance.js. Run them with `npm test` (needs Node 22 or newer).
// This file is not part of the app bundle: nothing imports it.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  distanceInKm,
  distanceInMeters,
  isWithinRadius,
  sortByDistance,
} from './distance.js';

const manila = { latitude: 14.5995, longitude: 120.9842 };
const quezonCity = { latitude: 14.676, longitude: 121.0437 };

test('distanceInKm is about 10.6 km between Manila and Quezon City', () => {
  const km = distanceInKm(manila, quezonCity);
  assert.ok(km > 10 && km < 11.5, `got ${km}`);
});

test('distance between the same point is 0', () => {
  assert.equal(distanceInKm(manila, manila), 0);
});

test('distanceInMeters is distanceInKm times 1000', () => {
  assert.equal(
    distanceInMeters(manila, quezonCity),
    distanceInKm(manila, quezonCity) * 1000,
  );
});

test('missing or invalid coordinates give null, never a number', () => {
  assert.equal(distanceInKm(null, manila), null);
  assert.equal(distanceInKm(manila, undefined), null);
  assert.equal(distanceInKm({ latitude: 'x', longitude: 1 }, manila), null);
  assert.equal(distanceInMeters(null, manila), null);
});

test('isWithinRadius is true inside the radius and false outside', () => {
  assert.equal(isWithinRadius(manila, manila, 200), true);
  assert.equal(isWithinRadius(quezonCity, manila, 200), false);
});

test('isWithinRadius is false when the location is missing (no check-in)', () => {
  assert.equal(isWithinRadius(null, manila, 200), false);
  assert.equal(isWithinRadius(manila, null, 200), false);
});

test('sortByDistance puts the nearest first and items without coordinates last', () => {
  const tutors = [
    { id: 'far', coordinates: quezonCity },
    { id: 'unknown' },
    { id: 'near', coordinates: manila },
  ];
  const sorted = sortByDistance(tutors, manila);
  assert.deepEqual(
    sorted.map((tutor) => tutor.id),
    ['near', 'far', 'unknown'],
  );
  assert.equal(sorted[0].distanceKm, 0);
  assert.equal(sorted[2].distanceKm, null);
});

test('sortByDistance does not change the list it was given', () => {
  const tutors = [{ id: 'a', coordinates: quezonCity }, { id: 'b', coordinates: manila }];
  sortByDistance(tutors, manila);
  assert.deepEqual(tutors.map((tutor) => tutor.id), ['a', 'b']);
  assert.equal('distanceKm' in tutors[0], false);
});

test('sortByDistance accepts a custom way to find the coordinates', () => {
  const sessions = [{ id: 's1', place: quezonCity }, { id: 's2', place: manila }];
  const sorted = sortByDistance(sessions, manila, (item) => item.place);
  assert.deepEqual(sorted.map((item) => item.id), ['s2', 's1']);
});
