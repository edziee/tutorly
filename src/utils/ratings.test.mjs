import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calculateUpdatedTutorRating,
  formatTutorRating,
  getRatingInputError,
  MAX_RATING_REVIEW_LENGTH,
} from './ratings.js';

test('displayed tutor ratings use at most two decimals without trailing zeros', () => {
  assert.equal(formatTutorRating(4.3333), '4.33');
  assert.equal(formatTutorRating(4.3), '4.3');
  assert.equal(formatTutorRating(5), '5');
  assert.equal(formatTutorRating(0), '0');
  assert.equal(formatTutorRating(Number.NaN), '');
});

test('rating validation accepts zero stars and an empty optional message', () => {
  assert.equal(getRatingInputError(0, ''), '');
  assert.equal(getRatingInputError(5, 'Helpful tutor'), '');
});

test('rating validation rejects scores outside 0–5 and messages that are too long', () => {
  assert.match(getRatingInputError(-1, ''), /0 to 5/);
  assert.match(getRatingInputError(6, ''), /0 to 5/);
  assert.match(getRatingInputError(2.5, ''), /0 to 5/);
  assert.match(getRatingInputError(3, 'x'.repeat(MAX_RATING_REVIEW_LENGTH + 1)), /1000/);
});

test('the first rating initializes the aggregate, including a zero-star rating', () => {
  assert.deepEqual(calculateUpdatedTutorRating(null, 0, 0), {
    rating: 0,
    reviewCount: 1,
  });
});

test('later ratings update the average and count', () => {
  assert.deepEqual(calculateUpdatedTutorRating(4, 2, 2), {
    rating: 10 / 3,
    reviewCount: 3,
  });
});

test('aggregate calculation rejects invalid existing aggregates', () => {
  assert.throws(() => calculateUpdatedTutorRating(4, -1, 2), /count is invalid/);
  assert.throws(() => calculateUpdatedTutorRating(null, 2, 2), /average is invalid/);
  assert.throws(() => calculateUpdatedTutorRating(8, 2, 2), /average is invalid/);
});
