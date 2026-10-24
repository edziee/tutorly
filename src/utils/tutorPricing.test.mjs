import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TUTOR_TYPES } from '../constants/statuses.js';
import {
  getMinimumTutorRate,
  getTutorRateError,
} from './tutorPricing.js';

test('peer and professional tutors have their respective minimum rates', () => {
  assert.equal(getMinimumTutorRate(TUTOR_TYPES.PEER), 200);
  assert.equal(getMinimumTutorRate(TUTOR_TYPES.PROFESSIONAL), 300);
});

test('minimum rates are allowed and lower rates return tutor-specific errors', () => {
  assert.equal(getTutorRateError(TUTOR_TYPES.PEER, 200), '');
  assert.equal(getTutorRateError(TUTOR_TYPES.PROFESSIONAL, 300), '');
  assert.match(getTutorRateError(TUTOR_TYPES.PEER, 199), /minimum session rate of 200 tokens/);
  assert.match(getTutorRateError(TUTOR_TYPES.PROFESSIONAL, 299), /minimum session rate of 300 tokens/);
});

test('invalid amounts and unknown tutor types are rejected', () => {
  assert.match(getTutorRateError(TUTOR_TYPES.PEER, 0), /greater than zero/);
  assert.match(getTutorRateError(TUTOR_TYPES.PEER, Number.NaN), /greater than zero/);
  assert.match(getTutorRateError('unknown', 400), /Could not verify the minimum rate/);
  assert.equal(getMinimumTutorRate('toString'), null);
});
