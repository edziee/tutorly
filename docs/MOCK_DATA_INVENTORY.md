# Runtime demo-data cleanup

Normal app screens should use their authenticated Firebase/service data and show a loading, empty, or error state when that data is unavailable. They must not fall back to fabricated records.

## Removed from runtime

| Runtime surface | Live source |
| --- | --- |
| Student schedule | `bookingService.subscribeToStudentBookings` |
| Shared student/tutor chat and tutor discovery | `chatService.subscribeToConversations` and `chatService.subscribeToChatTutors` |
| Tutor schedule and session ledger | `bookingService.subscribeToTutorBookings` |
| Admin review history | `adminService.subscribeToReviewedApplications` |
| Authentication preview identities | Firebase Authentication and `users/{uid}` profiles |

The retired `src/data/mock*.jsx` modules and sample chat portraits were removed after their screen imports were migrated. The student's old local-only session cache is migrated only to retain notification IDs for real bookings, then cleared; the new local cache stores reminder IDs only, not session records.

## Preserved test and seed resources

The cleanup scope is runtime-only. Test/seed resources such as `tests/seed-chat-demo.mjs`, `tests/firebase-loader.mjs`, `tests/chat-notifications.test.mjs`, and `firebase.chat-test.json` remain available for testing. No Firebase documents were deleted or changed.

## App configuration, not demo records

`src/data/courseCategories.jsx` and `src/data/tierCategories.jsx` contain UI filter options, not user or tutor records. They remain as application configuration.

## Testing guidance

- Configure Firebase with the project environment values before testing live features.
- Use real accounts for each role and create bookings, conversations, tutor applications, and review decisions in Firebase.
- Confirm empty-state behavior with an account that has no records.
- Keep test data isolated using the test configuration and scripts; do not substitute those fixtures into normal app screens.
