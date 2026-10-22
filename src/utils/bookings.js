// Helpers for working with booking lists on screens (see bookings in
// docs/FIRESTORE_SCHEMA.md). They are plain functions so they can be tested.
import { BOOKING_STATUS } from '../constants/statuses.js';

// "4:00 PM" -> 960 (minutes since midnight). Returns null if it cannot read it.
export function parseTimeToMinutes(text) {
  const match = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/.exec(text ?? '');
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;

  const isPm = match[3].toLowerCase() === 'pm';
  return ((hour % 12) + (isPm ? 12 : 0)) * 60 + minute;
}

// Today's date in the phone's own time zone, as "YYYY-MM-DD" (the dateKey form).
export function toDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getBookingTimeError({ dateKey, startTime, endTime, durationHours }, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey ?? '')) {
    return 'Choose a valid session date.';
  }
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime()) || toDateKey(date) !== dateKey) {
    return 'Choose a valid session date.';
  }
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 'Choose a valid session start and end time.';
  }
  if (
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > 3 ||
    endMinutes - startMinutes !== durationHours * 60
  ) {
    return 'Session time must match a duration between one and three hours.';
  }

  const todayKey = toDateKey(now);
  if (dateKey < todayKey || (dateKey === todayKey && startMinutes <= now.getHours() * 60 + now.getMinutes())) {
    return 'Choose a session time in the future.';
  }
  return '';
}

// The first session the student still has coming up: a booking that is
// 'upcoming' or still 'requested' and has not ended yet. Returns null if there
// is none. `now` can be passed in for testing.
export function getNextBooking(bookings, now = new Date()) {
  if (!Array.isArray(bookings)) return null;

  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const open = [BOOKING_STATUS.UPCOMING, BOOKING_STATUS.REQUESTED];

  const coming = bookings.filter((booking) => {
    if (!open.includes(booking?.status) || typeof booking.dateKey !== 'string') return false;
    if (booking.dateKey > todayKey) return true;
    if (booking.dateKey < todayKey) return false;

    // Today: keep it until it ends. If the end time cannot be read, use the start.
    const endsAt = parseTimeToMinutes(booking.endTime) ?? parseTimeToMinutes(booking.startTime);
    return endsAt === null || endsAt >= nowMinutes;
  });

  coming.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
    return (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0);
  });

  return coming[0] ?? null;
}
