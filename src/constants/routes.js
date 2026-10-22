// Screen names used with navigation.navigate(...). Agree on a name here first,
// then both the person building the screen (Member 3) and the person wiring its
// data can use it. Names already used by StudentNavigator keep the same value.
export const ROUTES = {
  // Auth stack (src/navigation/AuthNavigator.jsx)
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  ADMIN_LOGIN: 'AdminLogin', // hidden: never linked from the normal login screens

  // Student tabs (src/navigation/StudentNavigator.jsx, already built)
  TUTORS: 'Tutors',
  PROFILE: 'Profile',
  SCHEDULE: 'Schedule',
  TUTOR_PROFILE: 'TutorProfile',
  CHAT: 'Chat',

  // Student screens that open on top of the tabs
  STUDENT_DASHBOARD: 'StudentDashboard',
  BOOKING: 'Booking',
  PAYMENT: 'Payment',
  TUTORS_MAP: 'TutorsMap',
  CHECK_IN: 'CheckIn',

  // Shared by every role
  NOTIFICATIONS: 'Notifications',
  CONVERSATION: 'Conversation',

  // Professional tutor
  PROFESSIONAL_DASHBOARD: 'ProfessionalDashboard',

  // Admin
  ADMIN_DASHBOARD: 'AdminDashboard',
  ADMIN_USERS: 'AdminUsers',
  ADMIN_VERIFICATIONS: 'AdminVerifications',
  ADMIN_BOOKINGS: 'AdminBookings',
  ADMIN_REVIEW_HISTORY: 'AdminReviewHistory',
};
