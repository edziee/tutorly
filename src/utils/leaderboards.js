import { SESSION_TIMER_STATUS } from './sessionTimer.js';

export const TOP_RATED_MINIMUM_REVIEWS = 3;

export function getTutorLeaderboards(bookings, tutors, minimumReviews = TOP_RATED_MINIMUM_REVIEWS) {
  const hoursByTutor = new Map();
  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    if (
      booking?.status !== 'completed' ||
      booking?.timerStatus !== SESSION_TIMER_STATUS.STOPPED ||
      !Number.isSafeInteger(booking.accumulatedDurationSeconds) ||
      booking.accumulatedDurationSeconds <= 0 ||
      typeof booking.tutorId !== 'string'
    ) return;
    hoursByTutor.set(
      booking.tutorId,
      (hoursByTutor.get(booking.tutorId) ?? 0) + booking.accumulatedDurationSeconds / 3600,
    );
  });

  const tutorList = Array.isArray(tutors) ? tutors : [];
  const mostHoursTaught = tutorList
    .map((tutor) => ({
      tutorId: tutor.uid ?? tutor.id,
      name: tutor.name ?? 'Tutor',
      hoursTaught: hoursByTutor.get(tutor.uid ?? tutor.id) ?? 0,
    }))
    .filter((tutor) => tutor.hoursTaught > 0)
    .sort((first, second) => second.hoursTaught - first.hoursTaught);

  const topRatedTutors = tutorList
    .filter((tutor) =>
      Number.isFinite(tutor.rating) &&
      Number.isInteger(tutor.reviewCount) &&
      tutor.reviewCount >= minimumReviews,
    )
    .map((tutor) => ({
      tutorId: tutor.uid ?? tutor.id,
      name: tutor.name ?? 'Tutor',
      averageRating: tutor.rating,
      reviewCount: tutor.reviewCount,
    }))
    .sort((first, second) =>
      second.averageRating - first.averageRating || second.reviewCount - first.reviewCount,
    );

  return { mostHoursTaught, topRatedTutors };
}
