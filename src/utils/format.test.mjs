// Tests for format.js. Run them with `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDateKey, formatPeso, timeAgo, toDate } from './format.js';

// Fixed "now" so the results do not depend on when the test runs.
const NOW = new Date(2026, 9, 15, 12, 0, 0).getTime(); // Oct 15, 2026, noon (local time)
const ago = (seconds) => new Date(NOW - seconds * 1000);

test('toDate reads dates, numbers, text and Firestore timestamps', () => {
  const date = new Date(2026, 0, 2);
  assert.equal(toDate(date).getTime(), date.getTime());
  assert.equal(toDate(date.getTime()).getTime(), date.getTime());
  assert.equal(toDate({ toDate: () => date }).getTime(), date.getTime());
  assert.equal(toDate({ seconds: 1000 }).getTime(), 1000 * 1000);
  assert.equal(toDate(date.toISOString()).getTime(), date.getTime());
});

test('toDate gives null for anything that is not a date', () => {
  assert.equal(toDate(null), null);
  assert.equal(toDate(undefined), null);
  assert.equal(toDate('not a date'), null);
  assert.equal(toDate({}), null);
  assert.equal(toDate(new Date('nope')), null);
});

test('timeAgo says "Just now" under a minute, and for a time in the future', () => {
  assert.equal(timeAgo(ago(5), NOW), 'Just now');
  assert.equal(timeAgo(ago(59), NOW), 'Just now');
  assert.equal(timeAgo(ago(-30), NOW), 'Just now');
});

test('timeAgo counts minutes, hours and days with the right plural', () => {
  assert.equal(timeAgo(ago(60), NOW), '1 minute ago');
  assert.equal(timeAgo(ago(5 * 60), NOW), '5 minutes ago');
  assert.equal(timeAgo(ago(59 * 60 + 59), NOW), '59 minutes ago');
  assert.equal(timeAgo(ago(60 * 60), NOW), '1 hour ago');
  assert.equal(timeAgo(ago(3 * 3600), NOW), '3 hours ago');
  assert.equal(timeAgo(ago(24 * 3600), NOW), 'Yesterday');
  assert.equal(timeAgo(ago(4 * 86400), NOW), '4 days ago');
});

test('timeAgo switches to a date after a week', () => {
  assert.equal(timeAgo(new Date(2026, 9, 3, 9, 0), NOW), 'Oct 3');
  assert.equal(timeAgo(new Date(2025, 11, 25, 9, 0), NOW), 'Dec 25, 2025');
});

test('timeAgo works with a Firestore-style timestamp and gives "" for nothing', () => {
  assert.equal(timeAgo({ toDate: () => ago(120) }, NOW), '2 minutes ago');
  assert.equal(timeAgo(null, NOW), '');
  assert.equal(timeAgo('garbage', NOW), '');
});

test('formatPeso adds the peso sign, thousands commas and two decimals', () => {
  assert.equal(formatPeso(250), '₱250.00');
  assert.equal(formatPeso(1250.5), '₱1,250.50');
  assert.equal(formatPeso(1234567.891), '₱1,234,567.89');
  assert.equal(formatPeso(0), '₱0.00');
  assert.equal(formatPeso(-75), '-₱75.00');
});

test('formatPeso shows a dash instead of NaN', () => {
  assert.equal(formatPeso(undefined), '—');
  assert.equal(formatPeso(null), '—');
  assert.equal(formatPeso('250'), '—');
  assert.equal(formatPeso(Number.NaN), '—');
});

test('formatDateKey turns YYYY-MM-DD into a readable date', () => {
  assert.equal(formatDateKey('2026-10-15'), 'Oct 15, 2026');
  assert.equal(formatDateKey('2026-01-05'), 'Jan 5, 2026');
});

test('formatDateKey leaves text it cannot read as it was', () => {
  assert.equal(formatDateKey('Today'), 'Today');
  assert.equal(formatDateKey('2026-13-01'), '2026-13-01');
  assert.equal(formatDateKey(undefined), '');
});
