export const TUTOR_PRESENCE_HEARTBEAT_MS = 30_000;
export const TUTOR_PRESENCE_TIMEOUT_MS = 90_000;

export function getTutorPresenceLastSeenAt(tutor) {
  const timestamp = tutor?.lastSeenAt;
  if (typeof timestamp?.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate().getTime();
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) return timestamp;
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isTutorPresenceActive(tutor, now = Date.now()) {
  const lastSeenAt = getTutorPresenceLastSeenAt(tutor);
  return tutor?.online === true &&
    lastSeenAt !== null &&
    now - lastSeenAt <= TUTOR_PRESENCE_TIMEOUT_MS;
}
