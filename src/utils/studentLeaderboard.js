export function rankStudentLeaderboard(records) {
  if (!Array.isArray(records)) {
    throw new Error('Student leaderboard ranking needs a list of records.');
  }

  const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
  return [...records]
    .filter((record) =>
      typeof record?.studentId === 'string' &&
      typeof record.displayName === 'string' &&
      Number.isSafeInteger(record.badgeCount) &&
      record.badgeCount >= 0 &&
      Number.isSafeInteger(record.currentStreak) &&
      record.currentStreak >= 0)
    .sort((left, right) =>
      right.badgeCount - left.badgeCount ||
      right.currentStreak - left.currentStreak ||
      compareText(left.displayName, right.displayName) ||
      compareText(left.studentId, right.studentId))
    .map((record, index) => ({ ...record, rank: index + 1 }));
}
