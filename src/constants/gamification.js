export const STUDENT_BADGES = [
  { id: 'curious_mind', name: 'Curious Mind', description: 'Asked thoughtful questions and explored the topic.' },
  { id: 'prepared_learner', name: 'Ready to Learn', description: 'Came prepared with materials, questions, or a clear goal.' },
  { id: 'persistent_effort', name: 'Kept Going', description: 'Stayed engaged through a challenging concept.' },
  { id: 'big_step', name: 'Breakthrough Moment', description: 'Made progress on a concept or skill during the session.' },
  { id: 'clear_communicator', name: 'Clear Communicator', description: 'Shared ideas and questions clearly.' },
  { id: 'great_collaborator', name: 'Great Collaborator', description: 'Worked actively with the tutor to solve problems.' },
  { id: 'creative_thinker', name: 'Creative Thinker', description: 'Tried an original approach or made a useful connection.' },
  { id: 'practice_pro', name: 'Practice Pays Off', description: 'Put in focused effort while practicing.' },
  { id: 'goal_getter', name: 'Goal in Sight', description: 'Made progress toward a learning goal.' },
  { id: 'brave_beginner', name: 'Brave Beginner', description: 'Took a positive first step into a new topic.' },
  { id: 'thoughtful_reflector', name: 'Thoughtful Reflector', description: 'Reflected on what they learned and what to try next.' },
  { id: 'kind_and_respectful', name: 'Kind and Respectful', description: 'Helped make the session welcoming and respectful.' },
];

export const STUDENT_BADGE_BY_ID = Object.fromEntries(
  STUDENT_BADGES.map((badge) => [badge.id, badge]),
);

export const TUTOR_HOURS_OF_IMPACT_THRESHOLD_SECONDS = 10 * 60 * 60;

export const TUTOR_ACHIEVEMENTS = [
  {
    id: 'first_lesson',
    name: 'First Lesson',
    description: 'You completed your first tutoring session on Tutorly.',
    threshold: 1,
    criterion: 'completedBookings',
    criterionDescription: 'Unlocked after 1 confirmed completed booking.',
  },
  {
    id: 'steady_mentor',
    name: 'Steady Mentor',
    description: 'You have consistently supported learners over time.',
    threshold: 10,
    criterion: 'completedBookings',
    criterionDescription: 'Unlocked after 10 confirmed completed bookings.',
  },
  {
    id: 'experienced_guide',
    name: 'Experienced Guide',
    description: 'You have built a strong record of completed sessions.',
    threshold: 25,
    criterion: 'completedBookings',
    criterionDescription: 'Unlocked after 25 confirmed completed bookings.',
  },
  {
    id: 'hours_of_impact',
    name: 'Hours of Impact',
    description: 'Your teaching time has added up to a meaningful milestone.',
    threshold: TUTOR_HOURS_OF_IMPACT_THRESHOLD_SECONDS,
    criterion: 'teachingSeconds',
    criterionDescription: 'Unlocked after 10 timer-recorded teaching hours on completed sessions.',
  },
];

export const TUTOR_ACHIEVEMENT_BY_ID = Object.fromEntries(
  TUTOR_ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
);

export const MAX_STUDENT_BADGE_NOTE_LENGTH = 280;

export function getLimitedBadgePreview(items, isVisible, limit = 3) {
  if (!Array.isArray(items) || typeof isVisible !== 'function' ||
      !Number.isSafeInteger(limit) || limit < 0) {
    throw new Error('Badge preview needs a list, visibility check, and non-negative limit.');
  }
  let shownCount = 0;
  return items.filter((item) => {
    if (!isVisible(item)) return true;
    shownCount += 1;
    return shownCount <= limit;
  });
}

export function groupStudentBadgeAwards(awards, isVisible = () => true) {
  if (!Array.isArray(awards) || typeof isVisible !== 'function') {
    throw new Error('Badge grouping needs an award list and visibility check.');
  }
  const groups = new Map();
  awards.forEach((award) => {
    if (typeof award?.badgeId !== 'string' || !award.badgeId) return;
    let group = groups.get(award.badgeId);
    if (!group) {
      group = { badgeId: award.badgeId, count: 0, awards: [] };
      groups.set(award.badgeId, group);
    }
    group.count += 1;
    if (isVisible(award)) group.visibleCount = (group.visibleCount ?? 0) + 1;
    group.awards.push(award);
  });
  return [...groups.values()];
}

export function getNewlyQualifiedTutorAchievements({
  previousCompletedBookings,
  nextCompletedBookings,
  previousTeachingSeconds,
  nextTeachingSeconds,
}) {
  return TUTOR_ACHIEVEMENTS.filter((achievement) => {
    const previous = achievement.criterion === 'completedBookings'
      ? previousCompletedBookings
      : previousTeachingSeconds;
    const next = achievement.criterion === 'completedBookings'
      ? nextCompletedBookings
      : nextTeachingSeconds;
    return previous < achievement.threshold && next >= achievement.threshold;
  });
}
