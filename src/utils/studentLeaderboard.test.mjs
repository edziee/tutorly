import assert from 'node:assert/strict';
import test from 'node:test';

import { rankStudentLeaderboard } from './studentLeaderboard.js';

test('ranks students by badge count, then current streak', () => {
  const ranked = rankStudentLeaderboard([
    { studentId: 'streak', displayName: 'Streak', badgeCount: 2, currentStreak: 20 },
    { studentId: 'badges', displayName: 'Badges', badgeCount: 3, currentStreak: 1 },
    { studentId: 'tie-b', displayName: 'Beta', badgeCount: 2, currentStreak: 4 },
    { studentId: 'tie-a', displayName: 'Alpha', badgeCount: 2, currentStreak: 4 },
  ]);

  assert.deepEqual(ranked.map(({ studentId, rank }) => [studentId, rank]), [
    ['badges', 1],
    ['streak', 2],
    ['tie-a', 3],
    ['tie-b', 4],
  ]);
});

test('filters malformed public records and rejects invalid input', () => {
  assert.deepEqual(rankStudentLeaderboard([
    { studentId: 'valid', displayName: 'Valid', badgeCount: 0, currentStreak: 0 },
    { studentId: 'invalid', displayName: 'Invalid', badgeCount: -1, currentStreak: 0 },
  ]).map(({ studentId }) => studentId), ['valid']);
  assert.throws(() => rankStudentLeaderboard(null), /needs a list/);
});
