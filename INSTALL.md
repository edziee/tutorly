# Your part: chat with notifications

## Included

- Live conversations and messages in Firestore.
- Sending a message creates a `new_message` alert for the other participant.
- Unread notification count on the bell.
- Notifications list, mark-read actions, and opening the linked conversation.
- Chat screen, message composer, navigation wiring, and the earlier reference layout.
- Proposed chat permissions/indexes and isolated emulator tests.

## Team integration contract

Your teammate's authentication implementation supplies `useAuth()` with `user.uid` (or `user.id`) and `role`. That UID must equal `requireFirebase().auth.currentUser.uid`. Existing `users/{uid}` and approved `tutors/{uid}` documents follow the repository's schema.

This package leaves `AuthContext.jsx`, `authService.js`, login screens, `src/config/firebase.js`, `.env.example`, and the team's `firebase-rules/firestore.rules` unchanged. The current repository still has demo login placeholders; connecting real sign-in belongs to the authentication owner. The chat services require a real authenticated Firebase user.

Give `firebase-rules/chat-notifications.rules` and `firebase-rules/firestore.indexes.json` to the Firebase owner to merge into the team's rules and indexes. The proposal includes minimal user/tutor reads for isolated tests. `firebase.chat-test.json` is only for local tests and is not the project's deployment configuration.

Booking alerts, admin verification alerts, account creation, Firebase setup, and notification preferences are separate work.

## Apply locally

1. Save your current work on `feature/chat-notifications`.
2. Extract this ZIP to a temporary folder.
3. Copy its files into `D:\Project\tutorly`, preserving folder structure and replacing matching files.
4. Ask the authentication/Firebase owner to connect the identity and permissions above. Your existing `.env.local` stays local.
5. Restart Expo with `npx expo start -c`.

With real sign-in connected, use separate browser profiles or devices for a student and tutor. Send a message, check the recipient's bell, open the alert, and reply. Opening the chat clears its alerts. Notifications are in-app Firestore alerts; client notification creation is best effort after the message saves.

## Verify your chat services independently

Requires Java 21+ for the official Firebase emulators and the repository's installed Node dependencies.

Terminal 1:

```powershell
npm exec --yes --package firebase-tools -- firebase emulators:start --config firebase.chat-test.json --only firestore,auth --project demo-tutorly
```

Terminal 2:

```powershell
npm run test:chat
```

These tests create synthetic local identities without implementing the app's login. They cover message alerts, deduplication, unread/read state, 405-notification pagination, alert failure without losing the saved message, and rejection of unauthorized access. The narrowed package passed this integration test and an Expo production web export. The existing 43 utility-test pass is reused because utility inputs are unchanged.
