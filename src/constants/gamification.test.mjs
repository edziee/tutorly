import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getLimitedBadgePreview,
  getNewlyQualifiedTutorAchievements,
  groupStudentBadgeAwards,
  MAX_STUDENT_BADGE_NOTE_LENGTH,
  STUDENT_BADGES,
  TUTOR_ACHIEVEMENTS,
} from './gamification.js';

test('badge preview caps shown items at three without hiding preference controls', () => {
  const items = [
    { id: 'shown-1', visible: true },
    { id: 'hidden-1', visible: false },
    { id: 'shown-2', visible: true },
    { id: 'shown-3', visible: true },
    { id: 'hidden-2', visible: false },
    { id: 'shown-4', visible: true },
    { id: 'shown-5', visible: true },
  ];

  assert.deepEqual(
    getLimitedBadgePreview(items, (item) => item.visible).map(({ id }) => id),
    ['shown-1', 'hidden-1', 'shown-2', 'shown-3', 'hidden-2'],
  );
  assert.deepEqual(items.map(({ id }) => id), [
    'shown-1',
    'hidden-1',
    'shown-2',
    'shown-3',
    'hidden-2',
    'shown-4',
    'shown-5',
  ], 'preview calculation leaves the source list unchanged');
});

test('student badge groups count total and visible instances in award order', () => {
  const awards = [
    { id: 'a1', badgeId: 'thoughtful_reflector' },
    { id: 'b1', badgeId: 'kind_and_respectful' },
    { id: 'a2', badgeId: 'thoughtful_reflector' },
    { id: 'a3', badgeId: 'thoughtful_reflector' },
  ];
  const hidden = new Set(['a2']);

  assert.deepEqual(
    groupStudentBadgeAwards(awards, (award) => !hidden.has(award.id)).map(
      ({ badgeId, count, visibleCount, awards: instances }) => ({
        badgeId,
        count,
        visibleCount,
        ids: instances.map(({ id }) => id),
      }),
    ),
    [
      {
        badgeId: 'thoughtful_reflector',
        count: 3,
        visibleCount: 2,
        ids: ['a1', 'a2', 'a3'],
      },
      {
        badgeId: 'kind_and_respectful',
        count: 1,
        visibleCount: 1,
        ids: ['b1'],
      },
    ],
  );
});

test('student badge catalog matches all 12 stable IDs and limits notes', () => {
  assert.deepEqual(STUDENT_BADGES.map(({ id }) => id), [
    'curious_mind',
    'prepared_learner',
    'persistent_effort',
    'big_step',
    'clear_communicator',
    'great_collaborator',
    'creative_thinker',
    'practice_pro',
    'goal_getter',
    'brave_beginner',
    'thoughtful_reflector',
    'kind_and_respectful',
  ]);
  assert.equal(MAX_STUDENT_BADGE_NOTE_LENGTH, 280);
});

test('tutor achievements are earned exactly once when verified thresholds are crossed', () => {
  assert.deepEqual(TUTOR_ACHIEVEMENTS.map(({ id }) => id), [
    'first_lesson',
    'steady_mentor',
    'experienced_guide',
    'hours_of_impact',
  ]);
  const base = {
    previousCompletedBookings: 0,
    nextCompletedBookings: 1,
    previousTeachingSeconds: 0,
    nextTeachingSeconds: 1800,
  };
  assert.deepEqual(
    getNewlyQualifiedTutorAchievements(base).map(({ id }) => id),
    ['first_lesson'],
  );
  assert.deepEqual(
    getNewlyQualifiedTutorAchievements({
      ...base,
      previousCompletedBookings: 9,
      nextCompletedBookings: 10,
    }).map(({ id }) => id),
    ['steady_mentor'],
  );
  assert.deepEqual(
    getNewlyQualifiedTutorAchievements({
      ...base,
      previousCompletedBookings: 24,
      nextCompletedBookings: 25,
    }).map(({ id }) => id),
    ['experienced_guide'],
  );
  assert.deepEqual(
    getNewlyQualifiedTutorAchievements({
      ...base,
      nextTeachingSeconds: 36000,
    }).map(({ id }) => id),
    ['first_lesson', 'hours_of_impact'],
  );
  assert.deepEqual(
    getNewlyQualifiedTutorAchievements({
      ...base,
      previousCompletedBookings: 25,
      nextCompletedBookings: 26,
      previousTeachingSeconds: 36000,
      nextTeachingSeconds: 37800,
    }),
    [],
  );
});
