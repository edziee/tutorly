export const STREAK_MILESTONES = [3, 7, 14, 30];
export const MAX_STREAK_ACTIVITY_DAYS = 400;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(date) {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  return getLocalDateKey(previousDate);
}

function getActivityDates(storedState, lastLoginDate) {
  const dates = Array.isArray(storedState?.activityDates)
    ? storedState.activityDates.filter((dateKey) =>
      typeof dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
    : [];
  if (
    typeof lastLoginDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(lastLoginDate) &&
    !dates.includes(lastLoginDate)
  ) {
    dates.push(lastLoginDate);
  }
  return [...new Set(dates)].sort().slice(-MAX_STREAK_ACTIVITY_DAYS);
}

export function calculateStudentDailyLogin(storedState, profile, date = new Date()) {
  const today = getLocalDateKey(date);
  const lastLoginDate = storedState?.lastLoginDate ?? profile?.lastLoginDate;
  const activityDates = getActivityDates(storedState, lastLoginDate);
  if (storedState?.lastLoginDate === today) {
    return {
      firstLoginToday: false,
      streakDays: storedState.streakDays,
      milestone: null,
      activityDates,
    };
  }

  const previousStreak = Number(storedState?.streakDays ?? profile?.stats?.streakDays) || 0;
  const streakDays = lastLoginDate === getPreviousDateKey(date)
    ? previousStreak + 1
    : lastLoginDate
      ? 1
      : Math.max(previousStreak, 1);
  const updatedActivityDates = [...activityDates, today]
    .filter((dateKey, index, dates) => dates.indexOf(dateKey) === index)
    .sort()
    .slice(-MAX_STREAK_ACTIVITY_DAYS);
  return {
    firstLoginToday: true,
    streakDays,
    milestone: STREAK_MILESTONES.includes(streakDays) ? streakDays : null,
    lastLoginDate: today,
    activityDates: updatedActivityDates,
  };
}

export function getStudentCalendarDays(monthDate = new Date()) {
  if (!(monthDate instanceof Date) || Number.isNaN(monthDate.getTime())) {
    throw new Error('A valid month date is required to build the student calendar.');
  }
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, month, index - leadingDays + 1);
    return {
      dateKey: getLocalDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}
