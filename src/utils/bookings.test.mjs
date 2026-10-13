// Tests for bookings.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getNextBooking, parseTimeToMinutes, toDateKey } from './bookings.js';

// Oct 15, 2026, 3:00 PM in the phone's own time zone.
const NOW = new Date(2026, 9, 15, 15, 0, 0);

const booking = (id, dateKey, startTime, endTime, status = 'upcoming') => ({
  id,
  dateKey,
  startTime,
  endTime,
  status,
});

test('parseTimeToMinutes reads 12-hour times', () => {
  assert.equal(parseTimeToMinutes('4:00 PM'), 16 * 60);
  assert.equal(parseTimeToMinutes('9:30 am'), 9 * 60 + 30);
  assert.equal(parseTimeToMinutes('12:00 AM'), 0);
  assert.equal(parseTimeToMinutes('12:00 PM'), 12 * 60);
  assert.equal(parseTimeToMinutes(' 1:05 PM '), 13 * 60 + 5);
});

test('parseTimeToMinutes gives null for text it cannot read', () => {
  assert.equal(parseTimeToMinutes('16:00'), null);
  assert.equal(parseTimeToMinutes('13:00 PM'), null);
  assert.equal(parseTimeToMinutes('4:60 PM'), null);
  assert.equal(parseTimeToMinutes(''), null);
  assert.equal(parseTimeToMinutes(undefined), null);
});

test('toDateKey writes the local date as YYYY-MM-DD with zero padding', () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(toDateKey(NOW), '2026-10-15');
});

test('getNextBooking returns the earliest session still to come', () => {
  const bookings = [
    booking('later', '2026-10-20', '9:00 AM', '10:00 AM'),
    booking('soon', '2026-10-16', '2:00 PM', '3:00 PM'),
    booking('soonest-same-day', '2026-10-16', '9:00 AM', '10:00 AM'),
  ];
  assert.equal(getNextBooking(bookings, NOW).id, 'soonest-same-day');
});

test('getNextBooking includes a requested booking that is still waiting for the tutor', () => {
  const bookings = [booking('r', '2026-10-17', '9:00 AM', '10:00 AM', 'requested')];
  assert.equal(getNextBooking(bookings, NOW).id, 'r');
});

test('getNextBooking skips finished, rejected and cancelled bookings', () => {
  const bookings = [
    booking('done', '2026-10-16', '9:00 AM', '10:00 AM', 'completed'),
    booking('no', '2026-10-16', '9:00 AM', '10:00 AM', 'rejected'),
    booking('cancelled', '2026-10-16', '9:00 AM', '10:00 AM', 'cancelled'),
  ];
  assert.equal(getNextBooking(bookings, NOW), null);
});

test('getNextBooking skips past days and sessions that already ended today', () => {
  const bookings = [
    booking('yesterday', '2026-10-14', '4:00 PM', '5:00 PM'),
    booking('this-morning', '2026-10-15', '9:00 AM', '10:00 AM'),
  ];
  assert.equal(getNextBooking(bookings, NOW), null);
});

test('getNextBooking keeps a session that is happening right now', () => {
  const bookings = [booking('now', '2026-10-15', '2:30 PM', '3:30 PM')];
  assert.equal(getNextBooking(bookings, NOW).id, 'now');
});

test('getNextBooking keeps a later session today', () => {
  const bookings = [booking('evening', '2026-10-15', '6:00 PM', '7:00 PM')];
  assert.equal(getNextBooking(bookings, NOW).id, 'evening');
});

test('getNextBooking copes with missing data', () => {
  assert.equal(getNextBooking(undefined, NOW), null);
  assert.equal(getNextBooking([], NOW), null);
  assert.equal(getNextBooking([null, {}, { status: 'upcoming' }], NOW), null);
});

test('getNextBooking does not change the list it was given', () => {
  const bookings = [
    booking('b', '2026-10-20', '9:00 AM', '10:00 AM'),
    booking('a', '2026-10-16', '9:00 AM', '10:00 AM'),
  ];
  getNextBooking(bookings, NOW);
  assert.deepEqual(bookings.map((item) => item.id), ['b', 'a']);
});
