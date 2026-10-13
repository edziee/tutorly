// Text helpers for showing data on screens. Screens call these instead of
// formatting dates and prices themselves, so every screen shows them the same way.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Turns whatever the database gives us into a Date, or null if it is not a
// date. Accepts a Date, a number or text that new Date() understands, a
// Firestore Timestamp (it has toDate()), or the { seconds } shape of one.
export function toDate(value) {
  if (value === null || value === undefined) return null;

  let date = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'object' && typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value === 'object' && typeof value.seconds === 'number') {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === 'number' || typeof value === 'string') {
    date = new Date(value);
  }

  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'} ago`;

// "Just now", "5 minutes ago", "3 hours ago", "Yesterday", "4 days ago", then
// a plain date such as "Oct 3" (or "Oct 3, 2025" for another year). Used by the
// notifications list. Returns '' when there is no valid date.
export function timeAgo(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return '';

  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now'; // also covers a time slightly in the future

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return plural(days, 'day');

  const label = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? label
    : `${label}, ${date.getFullYear()}`;
}

// 1250 -> "₱1,250.00". Returns "—" when the amount is missing or not a number,
// so a screen never shows "₱NaN".
export function formatPeso(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';

  const [whole, cents] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}₱${grouped}.${cents}`;
}

// "2026-10-15" -> "Oct 15, 2026". Bookings keep their date as text in this form
// (dateKey, see docs/FIRESTORE_SCHEMA.md). Returns the text unchanged if it is
// not in that form.
export function formatDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey ?? '');
  if (!match) return dateKey ?? '';

  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return dateKey;
  return `${month} ${Number(match[3])}, ${match[1]}`;
}
