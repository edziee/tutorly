import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateStudentDailyLogin,
  getLocalDateKey,
  getStudentCalendarDays,
} from './studentStreak.js';

function priorDate(date, days = 1) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return getLocalDateKey(result);
}

test('only the first login on a local date advances the streak', () => {
  const today = new Date(2026, 9, 27, 12);
  const result = calculateStudentDailyLogin({
    streakDays: 6,
    lastLoginDate: getLocalDateKey(today),
  }, {}, today);

  assert.deepEqual(result, {
    firstLoginToday: false,
    streakDays: 6,
    milestone: null,
    activityDates: [getLocalDateKey(today)],
  });
});

test('consecutive logins award each configured milestone', () => {
  const today = new Date(2026, 9, 27, 12);
  for (const milestone of [3, 7, 14, 30]) {
    const result = calculateStudentDailyLogin({
      streakDays: milestone - 1,
      lastLoginDate: priorDate(today),
    }, {}, today);
    assert.equal(result.streakDays, milestone);
    assert.equal(result.milestone, milestone);
    assert.equal(result.firstLoginToday, true);
  }
});

test('a missed day resets the streak and the 30-day milestone is recognized', () => {
  const today = new Date(2026, 9, 27, 12);
  const brokenStreak = calculateStudentDailyLogin({
    streakDays: 20,
    lastLoginDate: priorDate(today, 2),
  }, {}, today);
  const milestone = calculateStudentDailyLogin({
    streakDays: 29,
    lastLoginDate: priorDate(today),
  }, {}, today);

  assert.equal(brokenStreak.streakDays, 1);
  assert.equal(brokenStreak.milestone, null);
  assert.equal(milestone.streakDays, 30);
  assert.equal(milestone.milestone, 30);
});

test('calendar grids start on Monday and include the right number of dates', () => {
  const february2026 = getStudentCalendarDays(new Date(2026, 1, 1));
  assert.equal(february2026.length, 35);
  assert.equal(february2026[0].dateKey, '2026-01-26');
  assert.equal(february2026[6].dateKey, '2026-02-01');
  assert.equal(february2026[6].isCurrentMonth, true);
  assert.equal(february2026[7].dateKey, '2026-02-02');
  assert.equal(february2026[34].dateKey, '2026-03-01');
  assert.equal(february2026[34].isCurrentMonth, false);

  const leapFebruary2024 = getStudentCalendarDays(new Date(2024, 1, 1));
  assert.equal(leapFebruary2024.length, 35);
  assert.equal(leapFebruary2024.filter((day) => day.isCurrentMonth).length, 29);
  assert.ok(leapFebruary2024.some((day) => day.dateKey === '2024-02-29'));

  const august2026 = getStudentCalendarDays(new Date(2026, 7, 1));
  assert.equal(august2026.length, 42);
  assert.equal(august2026[5].dateKey, '2026-08-01');
  assert.equal(august2026[41].dateKey, '2026-09-06');
});

test('daily login adds one activity date and bounds stored history', () => {
  const today = new Date(2026, 9, 27, 12);
  const storedState = {
    streakDays: 4,
    lastLoginDate: priorDate(today),
    activityDates: Array.from({ length: 401 }, (_, index) =>
      getLocalDateKey(new Date(2025, 0, index + 1))),
  };
  const result = calculateStudentDailyLogin(storedState, {}, today);

  assert.equal(result.activityDates.length, 400);
  assert.equal(result.activityDates.at(-1), getLocalDateKey(today));
  assert.equal(result.activityDates.includes(priorDate(today)), true);
  assert.equal(result.activityDates.includes('2025-01-01'), false);
});

test('calendar helper rejects invalid dates', () => {
  assert.throws(() => getStudentCalendarDays(new Date(Number.NaN)), /valid month date/);
});
