// Fixed lists of values that several members use. Keeping them here makes sure
// the screens, the services and the Firestore data all use the same words.

// Tutor tiers. These are the same words the tutors list filter already uses
// (see src/data/tierCategories.jsx). Some mock data still says "Faculty" or
// "Faculty Tier"; use PROFESSOR everywhere in the real data.
export const TUTOR_TIERS = {
  PEER: 'Peer Tutor',
  ALUMNI: 'Alumni',
  PROFESSOR: 'Professor',
};

// Booking life cycle. "upcoming" and "completed" are the values the schedule
// screen already uses; the others are new.
//   requested -> student asked, tutor has not answered yet
//   upcoming  -> tutor accepted, session has not happened yet
//   completed -> session is over
//   rejected  -> tutor declined the request
//   cancelled -> student or tutor cancelled after it was accepted
export const BOOKING_STATUS = {
  REQUESTED: 'requested',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Verification of tutors and professional tutors, reviewed by an admin.
export const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// What caused an in-app notification. Member 4 owns this list.
export const NOTIFICATION_TYPES = {
  BOOKING_REQUESTED: 'booking_requested',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_REJECTED: 'booking_rejected',
  SESSION_REMINDER: 'session_reminder',
  NEW_MESSAGE: 'new_message',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
};
