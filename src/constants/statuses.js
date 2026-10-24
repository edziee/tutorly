// Fixed lists of values that several members use. Keeping them here makes sure
// the screens, the services and the Firestore data all use the same words.

// Tutor tiers. Keep these values aligned with src/data/tierCategories.jsx and
// the public tutor profiles stored in Firestore.
export const TUTOR_TIERS = {
  PEER: 'Peer Tutor',
  ALUMNI: 'Alumni',
  PROFESSOR: 'Professor',
};

export const TUTOR_TYPES = {
  PEER: 'peer',
  PROFESSIONAL: 'professional',
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

export const BOOKING_PAYMENT_STATUS = {
  AWAITING_TUTOR_ACCEPTANCE: 'awaiting_tutor_acceptance',
  AWAITING_PAYMENT: 'awaiting_payment',
  PENDING_VERIFICATION: 'pending_verification',
  SETTLED: 'settled',
  NOT_APPLICABLE: 'not_applicable',
};

export const TOKEN_BOOKING_STATUS = {
  // Request is pending with no wallet changes. Acceptance charges the deposit
  // and holds the remainder; pre-acceptance closure is marked not_charged.
  PENDING: 'pending',
  NOT_CHARGED: 'not_charged',
  RESERVED: 'reserved',
  REFUNDED: 'refunded',
  SETTLED: 'settled',
};

export const TOKEN_TRANSACTION_TYPES = {
  ADMIN_CREDIT: 'admin_credit',
  ADMIN_DEBIT: 'admin_debit',
  BOOKING_ACCEPTANCE: 'booking_acceptance',
  BOOKING_DEPOSIT_HOLD: 'booking_deposit_hold',
  BOOKING_DEPOSIT_REFUND: 'booking_deposit_refund',
  BOOKING_RESERVE: 'booking_reserve',
  BOOKING_REFUND: 'booking_refund',
  BOOKING_SETTLEMENT_DEBIT: 'booking_settlement_debit',
  BOOKING_SETTLEMENT_CREDIT: 'booking_settlement_credit',
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
