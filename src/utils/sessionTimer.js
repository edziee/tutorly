export const SESSION_TIMER_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

export const SESSION_TIMER_ACTIONS = {
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  STOP: 'stop',
};

function isNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function toMilliseconds(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

export function getRecordedSeconds(timer, now = Date.now()) {
  const accumulated = isNonNegativeInteger(timer?.accumulatedDurationSeconds)
    ? timer.accumulatedDurationSeconds
    : 0;
  if (timer?.timerStatus !== SESSION_TIMER_STATUS.RUNNING) return accumulated;
  const startedAt = toMilliseconds(timer.timerStartedAt);
  if (startedAt === null) return accumulated;
  return accumulated + Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function formatRecordedDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function validateTimerTransition(booking, action) {
  const status = booking?.timerStatus ?? SESSION_TIMER_STATUS.IDLE;
  const transitions = {
    [SESSION_TIMER_ACTIONS.START]: [SESSION_TIMER_STATUS.IDLE],
    [SESSION_TIMER_ACTIONS.PAUSE]: [SESSION_TIMER_STATUS.RUNNING],
    [SESSION_TIMER_ACTIONS.RESUME]: [SESSION_TIMER_STATUS.PAUSED],
    [SESSION_TIMER_ACTIONS.STOP]: [SESSION_TIMER_STATUS.RUNNING, SESSION_TIMER_STATUS.PAUSED],
  };
  if (!transitions[action]?.includes(status)) {
    throw new Error(`Cannot ${action} a session while its timer is ${status}.`);
  }
  if (booking?.status !== 'upcoming') {
    throw new Error('Only an upcoming booking can use the session timer.');
  }
  if (!isNonNegativeInteger(booking?.accumulatedDurationSeconds ?? 0)) {
    throw new Error('This booking has invalid recorded timer data. Contact support.');
  }
  if (status === SESSION_TIMER_STATUS.RUNNING && toMilliseconds(booking.timerStartedAt) === null) {
    throw new Error('This running timer is missing its start timestamp. Contact support.');
  }
}

export function getEligibleTutorTeachingSeconds(bookings) {
  if (!Array.isArray(bookings)) return 0;
  return bookings.reduce((total, booking) => {
    if (booking?.status !== 'completed' || booking?.timerStatus !== SESSION_TIMER_STATUS.STOPPED) {
      return total;
    }
    const seconds = booking.accumulatedDurationSeconds;
    return total + (isNonNegativeInteger(seconds) ? seconds : 0);
  }, 0);
}

export function getCompletionTimerError(booking) {
  if (booking?.timerStatus !== SESSION_TIMER_STATUS.STOPPED) {
    return 'Stop the session timer and review the recorded teaching time before confirming completion.';
  }
  if (!isNonNegativeInteger(booking.accumulatedDurationSeconds) || booking.accumulatedDurationSeconds <= 0) {
    return 'A positive recorded teaching duration is required before confirming completion.';
  }
  return '';
}
