import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatRecordedDuration,
  getCompletionTimerError,
  getEligibleTutorTeachingSeconds,
  getRecordedSeconds,
  SESSION_TIMER_ACTIONS,
  SESSION_TIMER_STATUS,
  validateTimerTransition,
} from './sessionTimer.js';

test('timer recovery derives running time from persisted start timestamp', () => {
  assert.equal(getRecordedSeconds({
    timerStatus: SESSION_TIMER_STATUS.RUNNING,
    accumulatedDurationSeconds: 90,
    timerStartedAt: 100000,
  }, 101500), 91);
  assert.equal(formatRecordedDuration(3661), '01:01:01');
});

test('timer transitions support start, pause, resume, and stop', () => {
  const booking = { status: 'upcoming', timerStatus: SESSION_TIMER_STATUS.IDLE, accumulatedDurationSeconds: 0 };
  assert.doesNotThrow(() => validateTimerTransition(booking, SESSION_TIMER_ACTIONS.START));
  assert.doesNotThrow(() => validateTimerTransition({ ...booking, timerStatus: 'running', timerStartedAt: 100 }, SESSION_TIMER_ACTIONS.PAUSE));
  assert.doesNotThrow(() => validateTimerTransition({ ...booking, timerStatus: 'paused' }, SESSION_TIMER_ACTIONS.RESUME));
  assert.doesNotThrow(() => validateTimerTransition({ ...booking, timerStatus: 'paused' }, SESSION_TIMER_ACTIONS.STOP));
  assert.throws(() => validateTimerTransition({ ...booking, timerStatus: 'running' }, SESSION_TIMER_ACTIONS.PAUSE), /missing its start timestamp/);
});

test('completion requires a stopped positive recorded duration', () => {
  assert.match(getCompletionTimerError({ timerStatus: 'running' }), /Stop the session timer/);
  assert.match(getCompletionTimerError({ timerStatus: 'stopped', accumulatedDurationSeconds: 0 }), /positive/);
  assert.equal(getCompletionTimerError({ timerStatus: 'stopped', accumulatedDurationSeconds: 120 }), '');
});

test('eligible teaching totals exclude scheduled and incomplete bookings', () => {
  assert.equal(getEligibleTutorTeachingSeconds([
    { status: 'completed', timerStatus: 'stopped', accumulatedDurationSeconds: 3600, durationHours: 3 },
    { status: 'completed', timerStatus: 'paused', accumulatedDurationSeconds: 500 },
    { status: 'cancelled', timerStatus: 'stopped', accumulatedDurationSeconds: 1000 },
    { status: 'requested', durationHours: 8 },
  ]), 3600);
});
