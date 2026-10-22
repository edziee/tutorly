# Member 4: In-app notifications, chat and admin

You make messages and alerts arrive in real time, and give the admin the tools to review tutors. At the end you also coordinate the documentation and the demo.

**Read first:** [README](../../README.md), [ARCHITECTURE](../ARCHITECTURE.md), [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md), your section in [PROJECT_PLAN](../PROJECT_PLAN.md), [CONTRIBUTING](../../CONTRIBUTING.md).

## Your files

| File | State | What you do |
| --- | --- | --- |
| `src/services/chatService.js` | Placeholders | `subscribeToConversations`, `subscribeToMessages`, `getOrCreateConversation`, `sendMessage`, `markConversationRead` |
| `src/services/notificationService.js` | Placeholders | `createNotification`, `subscribeToNotifications`, `markNotificationRead`, `markAllNotificationsRead`, preferences |
| `src/services/adminService.js` | Placeholders | `getUsers`, `subscribeToPendingVerifications`, `setVerificationStatus`, `getBookingsOverview` |
| `src/constants/statuses.js` | Ready | `NOTIFICATION_TYPES` and `VERIFICATION_STATUS`. You own the notification list |
| `src/screens/shared/ChatScreen.jsx` | Firestore-backed | Uses `chatService` for conversations and approved tutor discovery |
| `src/screens/shared/NotificationsScreen.jsx` | Placeholder | Member 3 builds the layout, you connect `notificationService` |
| `src/components/NotificationCard.jsx` | Ready | One row of the list. It shows text, so turn the Firestore timestamp into text ("1 hour ago") in the screen |
| `src/screens/admin/` | Placeholders | Member 3 builds the four admin screens, you connect them to `adminService` |

## Tasks by week

Statuses live in [PROJECT_PLAN](../PROJECT_PLAN.md). Change them in the same pull request as your code.

**Week 1** (before Firebase is ready you can write the code, but you cannot run it)
- Plan the `conversations`, `messages` and `notifications` data and when a notification is created. The draft is in [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md). Confirm it with Member 1.

**Week 2**
- Real-time chat: use `onSnapshot` from `firebase/firestore` so new messages show without refreshing.
- Notifications created when a booking is requested or accepted, when a session reminder is due, and when a new message arrives. Agree with Member 2 who calls `createNotification` after a booking change.
- Admin: connect the admin dashboard and review history to Firestore. Users list, approve or reject tutor and professional verification, and bookings overview.

**Week 3**
- Notification preferences and read/unread states.
- Tell tutors in the app when an admin approves or rejects their verification (`verification_approved`, `verification_rejected`).
- Coordinate the final documentation, the demo script and the submission.

## Notifications: what they are here

The project requires **in-app** notifications: alerts shown inside the app. They are Firestore documents in `notifications`. The app listens to the user's own notifications and the bell shows a count of the unread ones. You do not need push notifications.

They are different from the session reminders in `ScheduleScreen`, which are local notifications scheduled on the phone with `expo-notifications` (they do not run in Expo Go). Do not mix the two up.

## Watch out for

- **Indexes:** a query that filters on `recipientId` and sorts on `createdAt` needs a composite index. When Firestore reports it, the error contains a link that creates it.
- **Stop listening:** every `subscribeTo...` function returns a function that stops the listener. Call it when the screen closes (return it from `useEffect`), or the app keeps reading in the background and uses up the free daily reads.
- **Admin is not secure by being hidden:** the real protection is Member 1's security rules in Week 3. Tell Member 1 which collections the admin needs to read and write.
- Chat conversations and tutor discovery, notifications, and admin review history use their Firestore services. Runtime demo datasets have been removed; test/seed fixtures remain separate as noted in [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md).

## Done when

A message or booking request shows a notification to the other user inside the app, chat works in real time, and an admin can approve or reject a tutor or professional verification.
