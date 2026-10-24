# What the new screens expect from the services

Member 3 built these screens without mock data. They call the service functions below and read the fields listed here. When you implement a service function, return data in this shape and the screen works without any change. If you need a different shape, change this file in the same pull request and tell Member 3.

The function names and inputs are the ones already in `src/services` and are not changed.

## Rules that apply to every screen

- **Ids:** a list item must carry its Firestore document id as `id` (`{ id: doc.id, ...doc.data() }`). The screens use it as the list key and when they act on the item.
- **The logged-in user:** `useAuth().user` must include `uid` (or `id`), `name`, `role` and, for students, the `stats` map. The id is not a field inside the Firestore document, so `getUserProfile` has to add it.
- **Timestamps:** `createdAt` can be a Firestore Timestamp. The screens convert it.
- **Errors:** throw a normal `Error`. The screens show a safe message for known Firebase codes (`auth/...`, `permission-denied`, `unavailable`) and a generic one for everything else. They also show the team's "not implemented yet" messages as they are.
- **Live functions** (`subscribeTo...`) must return the function that stops listening. The screens call it when they close.

## Screens

The student workspace has four visible tabs: Tutors, Profile, Schedule, and Messages. Profile also contains the former Dashboard’s study progress and next-session content.

| Screen | Service function | Fields the screen reads |
| --- | --- | --- |
| `LoginScreen` | `authService.signIn(email, password, portal)` | `portal` must be `student` or `tutor` and must match the account role; legacy `professional` accounts match the tutor portal. A mismatch signs the account out and shows an error. On success, `AuthContext` and `AppNavigator` route by the saved role |
| `SignUpScreen` | `authService.signUp({ email, password, role, profile: { name, campusId, tutorType? } })` | The result is ignored. `role` is `student` or `tutor`. New tutor sign-ups use `tutorType: 'professional'`, may omit `campusId`, and start with `tutorVerificationStatus: 'pending'`; existing peer tutors continue to sign in using the Tutor portal. Student applicants retain `role: 'student'` and use the separate application flow |
| `StudentProfileScreen` | `useAuth().user`, `useAuth().updateProfile(changes)`, `useAuth().setWorkspaceMode(mode)` | Profile fields are loaded from `users/{uid}`. Editable fields include `name`, `age`, `location`, `phone`, and an optional HTTPS `photoUrl`; email and role are read-only. This screen also contains study progress, tutor-workspace switching, and the tutor application entry point |
| `TutorProfileScreen` | `tutorService.getTutorApplication(uid)`, `saveTutorApplication(uid, application)` | Private application data is stored in `tutorApplications/{uid}`; public discovery fields are stored in `tutors/{uid}`. Both tutor types list courses. Peer tutors require a 1.00–1.50 grade and course-level proof description/Drive URL; Alumni/Professors may omit grades and instead require one application-level proof description/Drive URL. Submitted applications have `verificationStatus: 'pending'` |
| `StudentProfileScreen` | `useAuth().user.stats` | `streakDays`, `weeklyActivity` (7 true or false values, Monday first), `scholarLevel`, `scholarProgress` (0 to 100), `studyHours`, `completedSessions`, `rating`, `leaderboard`, and `subjectHonors`. Missing values show as 0 or an empty state |
| `StudentProfileScreen` | `bookingService.subscribeToStudentBookings(userId, callback)` | `id`, `status`, `dateKey`, `startTime`, `endTime`, `tutorName`, `subject`, `location`. The "next session" is the earliest booking with status `upcoming` or `requested` that has not ended |
| `NotificationsScreen` | `notificationService.subscribeToNotifications(userId, callback)` | `id`, `title`, `message`, `read`, `createdAt`. Newest first |
| `NotificationsScreen` | `markNotificationRead(id)`, `markAllNotificationsRead(userId)` | Nothing returned |
| `AdminDashboardScreen` | `adminService.getUsers()` | `role` of every user |
| `AdminDashboardScreen` | `adminService.getBookingsOverview()` | `status` of every booking |
| `AdminDashboardScreen` | `adminService.subscribeToPendingVerifications(callback)` | Only the length of the list |
| `AdminUsersScreen` | `adminService.getUsers({ role })` | `id`, `name`, `email`, `role`, `verificationStatus` (tutors only). Called with `{}` for "All" |
| `AdminVerificationsScreen` | `adminService.subscribeToPendingVerifications(callback)` | `id`, `name`, `tutorType`, `tier`, `subject`, `courses: [{ id, code, title, grade, proofName?, proofUrl? }]`, and optional application-level `applicationProofName` / `applicationProofUrl`. A tutor must leave this list once approved or rejected |
| `AdminVerificationsScreen` | `adminService.setVerificationStatus(tutorId, status, { reviewerId, reason })` | `status` is `approved` or `rejected`. `reason` is only sent when rejecting |
| `AdminVerificationsScreen` | `adminService.setDirectTutorAccountVerificationStatus(uid, status, { reviewerId, reason })` | Direct tutor sign-ups are reviewed using basic account fields. Approval changes account status only; it does not enable tutor operations without approved tutor profile and application data |
| `AdminBookingsScreen` | `adminService.getBookingsOverview()` | `id`, `subject`, `studentName`, `tutorName`, `dateKey`, `startTime`, `endTime`, `status`, `totalAmount` (a number in pesos) |

## Not built yet

- **Verification proof:** peer tutor evidence is attached to each course at `courses[].proofUrl` and `courses[].proofName`; Alumni/Professor evidence is attached once to the application at `applicationProofUrl` and `applicationProofName`. These are tutor-submitted Google Drive links and descriptions; the app stores no file bytes and does not upload to Firebase Storage on the Spark plan. The tutor-side form and service enforce the evidence rules, but an admin must still verify proof. See [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md).
- **Opening a notification:** tapping one only marks it read. Going to the booking or chat it is about needs those screens. `data` (`{ bookingId }` or `{ conversationId }`) is where the target will come from.
- **Google login and "Forgot password?":** left out because there is no service function for them. Ask Member 1 to add `signInWithGoogle` and `sendPasswordReset` and tell Member 3.
- **Leaderboard data:** there is no service function for it yet; Profile displays the leaderboard and honors already present in `user.stats`.
