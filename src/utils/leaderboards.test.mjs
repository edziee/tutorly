import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getTutorLeaderboards, TOP_RATED_MINIMUM_REVIEWS } from './leaderboards.js';

test('most hours taught uses recorded seconds from eligible completed bookings only', () => {
  const result = getTutorLeaderboards([
    { tutorId: 'a', status: 'completed', timerStatus: 'stopped', accumulatedDurationSeconds: 5400, durationHours: 1 },
    { tutorId: 'a', status: 'requested', durationHours: 20 },
    { tutorId: 'b', status: 'cancelled', timerStatus: 'stopped', accumulatedDurationSeconds: 99999 },
  ], [{ uid: 'a', name: 'A' }, { uid: 'b', name: 'B' }]);
  assert.deepEqual(result.mostHoursTaught, [{ tutorId: 'a', name: 'A', hoursTaught: 1.5 }]);
});

test('top-rated tutors requires the documented minimum review count', () => {
  const result = getTutorLeaderboards([], [
    { uid: 'a', name: 'A', rating: 5, reviewCount: TOP_RATED_MINIMUM_REVIEWS },
    { uid: 'b', name: 'B', rating: 5, reviewCount: 1 },
    { uid: 'c', name: 'C', rating: 4, reviewCount: 8 },
  ]);
  assert.deepEqual(result.topRatedTutors, [
    { tutorId: 'a', name: 'A', averageRating: 5, reviewCount: 3 },
    { tutorId: 'c', name: 'C', averageRating: 4, reviewCount: 8 },
  ]);
});
