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

| Screen | Service function | Fields the screen reads |
| --- | --- | --- |
| `LoginScreen` | `authService.signIn(email, password)` | The result is ignored. It does not navigate: `AuthContext` sees the new user and `AppNavigator` switches role |
| `SignUpScreen` | `authService.signUp({ email, password, role, profile: { name, campusId } })` | The result is ignored. `role` is `student`, `tutor` or `professional`. Professional tutors do not send a `campusId` |
| `StudentDashboardScreen` | `useAuth().user.stats` | `streakDays`, `weeklyActivity` (7 true or false values, Monday first), `scholarLevel`, `scholarProgress` (0 to 100), `studyHours`, `completedSessions`, `rating`. Missing values show as 0 |
| `StudentDashboardScreen` | `bookingService.subscribeToStudentBookings(userId, callback)` | `id`, `status`, `dateKey`, `startTime`, `endTime`, `tutorName`, `subject`, `location`. The "next session" is the earliest booking with status `upcoming` or `requested` that has not ended |
| `NotificationsScreen` | `notificationService.subscribeToNotifications(userId, callback)` | `id`, `title`, `message`, `read`, `createdAt`. Newest first |
| `NotificationsScreen` | `markNotificationRead(id)`, `markAllNotificationsRead(userId)` | Nothing returned |
| `AdminDashboardScreen` | `adminService.getUsers()` | `role` of every user |
| `AdminDashboardScreen` | `adminService.getBookingsOverview()` | `status` of every booking |
| `AdminDashboardScreen` | `adminService.subscribeToPendingVerifications(callback)` | Only the length of the list |
| `AdminUsersScreen` | `adminService.getUsers({ role })` | `id`, `name`, `email`, `role`, `verificationStatus` (tutors only). Called with `{}` for "All" |
| `AdminVerificationsScreen` | `adminService.subscribeToPendingVerifications(callback)` | `id`, `name`, `tier`, `subject`, `courses: [{ code, title, grade }]`. A tutor must leave this list once approved or rejected |
| `AdminVerificationsScreen` | `adminService.setVerificationStatus(tutorId, status, { reviewerId, reason })` | `status` is `approved` or `rejected`. `reason` is only sent when rejecting |
| `AdminBookingsScreen` | `adminService.getBookingsOverview()` | `id`, `subject`, `studentName`, `tutorName`, `dateKey`, `startTime`, `endTime`, `status`, `totalAmount` (a number in pesos) |

## Not built yet

- **Verification proof:** the verification screen shows the submitted courses and may open `courses[].proofUrl` when present. `courses[].proofName` is descriptive only; there is no Firebase file upload on the Spark plan. See [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md).
- **Opening a notification:** tapping one only marks it read. Going to the booking or chat it is about needs those screens. `data` (`{ bookingId }` or `{ conversationId }`) is where the target will come from.
- **Google login and "Forgot password?":** left out because there is no service function for them. Ask Member 1 to add `signInWithGoogle` and `sendPasswordReset` and tell Member 3.
- **Leaderboard on the dashboard:** there is no service function for it.
