# Firestore data structure (draft)

This is a **proposal** for the Week 1 task "Design Firestore structure". It was drawn from the fields the mock data uses today (see [`MOCK_DATA_INVENTORY.md`](MOCK_DATA_INVENTORY.md)). **Member 1 confirms or changes it in Week 1**, and after that every change goes through Member 1 and is written here in the same pull request.

Collection names and fixed values also exist in code: `src/constants/collections.js`, `roles.js` and `statuses.js`.

## Collections at a glance

| Collection | One document is | Who writes it |
| --- | --- | --- |
| `users/{uid}` | An account of any role | The user (never the `role` after sign-up) |
| `tutors/{uid}` | The public profile of a tutor, including Professor / Alumni accounts, same id as their user | The tutor; admin changes verification |
| `bookings/{id}` | A session between a student and a tutor | Student creates, tutor answers |
| `conversations/{id}` | A chat between one student and one tutor | Either person in the chat |
| `conversations/{id}/messages/{id}` | One message | Either person in the chat |
| `notifications/{id}` | One in-app alert for one user | The app, on events |

`{uid}` is the Firebase Authentication user id.

## `users/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | |
| `role` | `'student'` \| `'tutor'` \| `'professional'` (legacy) \| `'admin'` | Set once at sign-up. Peer tutors and Professor / Alumni accounts use `'tutor'`; existing `'professional'` accounts remain supported as tutors. Users must not be able to change it, and nobody can sign up as `admin` (admins are created in the Firebase console) |
| `name` | string | |
| `phone`, `age`, `location` (city), `year`, `campus`, `campusAddress` | string | From the student profile screen |
| `photoUrl` | string | Optional instructor-approved external image URL. If empty, show initials; do not use Firebase Storage |
| `notificationPreferences` | map of booleans | Week 3, Member 4 (for example `bookings`, `messages`, `reminders`) |
| `createdAt` | timestamp | |

Student progress shown on the profile screen (`streakDays`, `weeklyActivity`, `scholarLevel`, `scholarProgress`, `studyHours`, `completedSessions`, `rating`, `subjectHonors`) can live in a `stats` map on this document. Most of it can be calculated from completed bookings instead of stored; Member 1 and Member 2 decide.

## `tutors/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | The screens work out initials and short names from this; do not store them |
| `tier` | `'Peer Tutor'` \| `'Alumni'` \| `'Professor'` | `TUTOR_TIERS` in `statuses.js` |
| `subject` | string | Main subject shown on the card, for example `CS 240: Algorithms` |
| `hourlyRate` | number | Pesos, a number and not text like `₱250.00`. The screen formats it |
| `rating`, `reviewCount` | number | |
| `location` | string | City name shown on the card |
| `coordinates` | map `{ latitude, longitude }` | New. Used for the map and nearby sorting (Week 3) |
| `credentials`, `bio`, `teachingPhilosophy` | string | |
| `availability` | array of string | For example `'Monday, 4:00 PM'`, as the mock data has it |
| `preferredDays`, `preferredTimeSlots` | array of string | From the tutor application |
| `courses` | array of `{ code, title, grade, proofUrl, proofName }` | The courses from the application. `proofUrl` is an optional reviewable external URL; `proofName` is the tutor-entered document title |
| `online` | boolean | |
| `photoUrl` | string | Optional instructor-approved external image URL; otherwise use initials |
| `verificationStatus` | `'not_submitted'` \| `'pending'` \| `'approved'` \| `'rejected'` | `VERIFICATION_STATUS`. Students only see `approved` tutors |
| `verificationNote` | string | Reason, when an admin rejects |
| `verificationReviewedBy`, `verificationReviewedAt` | string, timestamp | The admin and the time |

## `bookings/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `studentId`, `tutorId` | string | |
| `studentName`, `tutorName`, `tutorTier` | string | Copied into the booking so the schedule can be shown without loading each tutor |
| `subject` | string | |
| `dateKey` | string `YYYY-MM-DD` | What the schedule screen uses today |
| `startTime`, `endTime` | string, for example `'4:00 PM'` | Same |
| `durationHours` | number | |
| `status` | `'requested'` \| `'upcoming'` \| `'completed'` \| `'rejected'` \| `'cancelled'` | `BOOKING_STATUS` |
| `location` | string | |
| `notes` | string | |
| `totalAmount` | number | Pesos. The screen formats it |
| `paymentStatus` | string | The mock data uses `Escrow protected`, `Released` and `Settled`. Member 2 decides the final set and the screen maps each to its label |
| `review`, `rating` | string, number | The mock data's `rating` holds review text; a star rating is optional |
| `checkedInAt`, `checkInCoordinates` | timestamp, map | Week 3 |
| `createdAt`, `updatedAt` | timestamp | |

## `conversations/{id}` and `messages`

`conversations/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `studentId`, `tutorId` | string | |
| `participantIds` | array of string | Both ids, so one query finds all of a user's chats |
| `studentName`, `tutorName`, `tutorTier` | string | Copied for the list |
| `lastMessage` | string | The preview |
| `lastMessageAt` | timestamp | Sort order |
| `unreadBy` | array of string | Ids of the people who have not opened the newest message |

`conversations/{id}/messages/{id}`: `senderId` (string), `text` (string), `createdAt` (timestamp).

The filter tabs on the Messages screen (`All Messages`, `Active Tutors`, `Faculty / Profs`) are worked out from `tutorTier` and the bookings, not stored.

## `notifications/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `recipientId` | string | Who sees it |
| `type` | string | `NOTIFICATION_TYPES` in `statuses.js` |
| `title`, `message` | string | |
| `data` | map | Where to go on tap, for example `{ bookingId }` or `{ conversationId }` |
| `read` | boolean | |
| `createdAt` | timestamp | |

## Files and images on the Spark plan

Firebase Storage is intentionally not used because it requires the paid Blaze plan. The app stores only metadata and optional external URLs:

| Field | What it contains | Rule |
| --- | --- | --- |
| `courses[].proofUrl` | A reviewable URL supplied by the tutor | The tutor must confirm that the assigned admin can open it |
| `courses[].proofName` | The document title or file name | Informational only; it is not an uploaded file |
| `users/{uid}.photoUrl` or `tutors/{uid}.photoUrl` | An instructor-approved external image URL | If absent or invalid, show initials |

Never store a device-local `file://` URI, base64 file contents, or a Firebase Storage path. If no approved external host is available, keep structured proof details and leave `proofUrl` empty.

## Things to know about queries

- A query that filters on one field and sorts on another, for example notifications where `recipientId` equals the user's id ordered by `createdAt`, needs a **composite index**. Firestore prints an error with a link in the console that creates it with one click.
- Firestore reads and writes cost per document, so listen to a small, filtered list (this user's bookings), never a whole collection.

## Open questions for Week 1

1. **Leaderboard:** the profile screen shows other students' names and points. Showing them needs rules that let one student read others' stats. Either keep a small public stats document per student, or drop the leaderboard from the real data.
2. **Real timestamps:** bookings keep `dateKey` and time text because the schedule screen is built on them. Reminders and sorting are easier with a real `startAt` timestamp. Member 2 decides whether to add it.
3. **Who creates notifications:** the app creates the notification document after a booking, message or verification write succeeds. Cloud Functions and scheduled functions are intentionally not used on the Spark plan. These alerts are best effort and are not a trusted audit log.
4. **Tier names:** some mock data says `Faculty` or `Faculty Tier`. The real data uses `Professor` only.
