// Firestore collection names. Import these instead of typing the strings.
// This is a proposal: Member 1 confirms the final structure in Week 1 and
// documents any change in docs/FIRESTORE_SCHEMA.md. Ask Member 1 before adding
// or renaming a collection.
export const COLLECTIONS = {
  USERS: 'users', // one document per account, includes the role field
  TUTORS: 'tutors', // public tutor profile, same id as the user's uid
  BOOKINGS: 'bookings', // sessions between a student and a tutor
  CONVERSATIONS: 'conversations', // one chat between a student and a tutor
  MESSAGES: 'messages', // subcollection: conversations/{id}/messages
  NOTIFICATIONS: 'notifications', // in-app alerts, one document per alert
};
