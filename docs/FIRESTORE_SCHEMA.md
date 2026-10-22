# Firestore data structure (team review)

This schema is the team's working proposal for the Week 1 task "Design Firestore structure". It was drawn from the fields the mock data uses today (see [`MOCK_DATA_INVENTORY.md`](MOCK_DATA_INVENTORY.md)). The collection layout and role values are reflected in the app, but the team still needs to review the open decisions at the end of this document before calling the schema final. After agreement, changes go through Member 1 and are documented here in the same pull request.

The app is staying on Firebase's free Spark plan. It uses Firebase Authentication and Firestore only: do not use Firebase Storage, Cloud Functions, scheduled functions, or Firebase Extensions. Tutor verification evidence is a Google Drive URL plus structured metadata; file bytes are not uploaded to Firebase.

Collection names and fixed values also exist in code: `src/constants/collections.js`, `roles.js` and `statuses.js`.

## Collections at a glance

| Collection | One document is | Who writes it |
| --- | --- | --- |
| `users/{uid}` | An account of any role | The user (never the `role` after sign-up) |
| `tutors/{uid}` | Public profile fields students need to find and book a tutor, same id as their user | The tutor; admin publishes approval |
| `tutorApplications/{uid}` | Private application evidence and payment QR details, same id as their user | The tutor; admin reviews verification |
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
| `tutorType` | `'peer'` \| `'professional'` | Tutor accounts only. Saved at sign-up to determine the verification evidence requirements; never user-editable. Existing accounts without it infer the type from their tutor application tier |
| `name` | string | |
| `phone`, `age`, `location` (city), `year`, `campus`, `campusAddress` | string | From the student profile screen |
| `photoUrl` | string | Optional instructor-approved external image URL. If empty, show initials; do not use Firebase Storage |
| `notificationPreferences` | map of booleans | Week 3, Member 4 (for example `bookings`, `messages`, `reminders`) |
| `createdAt` | timestamp | |

Student progress shown on the profile screen (`streakDays`, `weeklyActivity`, `scholarLevel`, `scholarProgress`, `studyHours`, `completedSessions`, `rating`, `subjectHonors`) can live in a `stats` map on this document. The app shows neutral empty/zero values when the corresponding data has not been saved; it must not present sample leaderboard entries or statistics as real account data. Most progress can be calculated from completed bookings instead of stored; Member 1 and Member 2 decide.

## `tutors/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | The screens work out initials and short names from this; do not store them |
| `tier` | `'Peer Tutor'` \| `'Alumni'` \| `'Professor'` | `TUTOR_TIERS` in `statuses.js` |
| `tutorType` | `'peer'` \| `'professional'` | Mirrors the sign-up type and controls evidence validation |
| `subject` | string | Main subject shown on the card, for example `CS 240: Algorithms` |
| `rating`, `reviewCount` | number | |
| `location` | string | City name shown on the card |
| `coordinates` | map `{ latitude, longitude }` | New. Used for the map and nearby sorting (Week 3) |
| `credentials`, `bio`, `teachingPhilosophy` | string | |
| `availability` | array of string | For example `'Monday, 4:00 PM'`, as the mock data has it |
| `preferredDays`, `preferredTimeSlots` | array of string | From the tutor application |
| `formats` | array of string | Selected teaching formats from the tutor application |
| `courseNames` | newline-separated string | Public course code/title labels only. The app derives its display list from this field; do not put grades or proof details here |
| `online` | boolean | |
| `photoUrl` | string | Optional instructor-approved external image URL; otherwise use initials |
| `hourlyRate` | number | The tutor's session price in pesos (the current booking flow treats it as the fee for a session of up to 3 hours). |
| `verificationStatus` | `'not_submitted'` \| `'pending'` \| `'approved'` \| `'rejected'` | `VERIFICATION_STATUS`. Students only see `approved` tutors |
| `verificationNote` | string | Public profile field; rejected tutors are not visible to students |
| `publicProfileVersion` | number | Must be `2` before students can read a profile. This keeps legacy documents containing proof fields private until migrated |

## `tutorApplications/{uid}` (private)

This document is readable only by its tutor and admins. Keep verification proof and payment QR fields here, never in `tutors/{uid}`, because Firestore security rules cannot hide selected fields from clients that can read a document.

| Field | Type | Notes |
|---|---|---|
| `name`, `tutorType`, `tier`, `credentials` | string | Tutor application identity and category |
| `preferredDays`, `preferredTimeSlots`, `formats` | array of strings | Application preferences |
| `courses` | array of `{ id, code, title, grade, proofUrl?, proofName? }` | Peer tutors require eligible grades and course-level proof. Alumni/Professors may leave grades blank |
| `applicationProofName`, `applicationProofUrl` | string | Alumni/Professor proof description and HTTPS Google Drive URL |
| `teachingPhilosophy` | string | Tutor application text |
| `paymentQrUrl` | string | Optional HTTPS QR image URL. Copied to a booking only when the tutor accepts it |
| `verificationStatus`, `verificationNote` | string | Pending/approved/rejected status and rejection reason |
| `verificationReviewedBy`, `verificationReviewedAt` | string, timestamp | Admin reviewer and review time |
| `createdAt`, `updatedAt` | timestamp | |

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
| `sessionMode` | string | The session format selected by the student, copied from the tutor's listed formats |
| `notes` | string | |
| `totalAmount` | number | Pesos. The screen formats it |
| `paymentStatus` | `'awaiting_tutor_acceptance'` \| `'awaiting_payment'` \| `'pending_verification'` \| `'settled'` \| `'not_applicable'` | A QR transfer is not considered paid/settled until the tutor manually verifies the student's report |
| `tutorQrUrl`, `tutorPhotoUrl` | string | QR image and optional tutor photo copied to the booking when the tutor accepts; only booking participants and admins can read it |
| `paymentReportedAt`, `paymentVerifiedAt` | timestamp | Student report time and tutor verification time |
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

## Tutor proof and images on the Spark plan

Firebase Storage is intentionally not used; the app does not upload proof files or profile photos to Firebase. For verification, all tutors list the courses they want to tutor. Peer tutors provide a qualifying grade and a Google Drive sharing URL plus proof description for each course. Alumni/Professors may leave grades blank and provide one application-level proof description and Drive URL. Firestore stores URLs and metadata only in `tutorApplications/{uid}`:

| Field | What it contains | Rule |
| --- | --- | --- |
| `courses[].proofUrl` | Peer Tutor's HTTPS Google Drive sharing URL for that course | Private to the tutor and admins. Must point to Drive/Docs, not a local file |
| `courses[].proofName` | Peer Tutor's proof type/title for that course | Private; informational only, not an uploaded file |
| `applicationProofUrl` | Alumni/Professor's HTTPS Google Drive sharing URL for the application | Private; one link should cover the submitted professional proof and listed tutoring courses |
| `applicationProofName` | Alumni/Professor's proof type/description | Private; informational only, not an uploaded file |
| `users/{uid}.photoUrl` or `tutors/{uid}.photoUrl` | An instructor-approved external image URL | If absent or invalid, show initials |

The app should accept only HTTPS URLs on the expected Google Drive/Docs hosts (for example, `drive.google.com` and `docs.google.com`), and show the destination host before opening a submitted link. URL validation only checks that the address looks like a Drive link; it does not prove that the file exists, is safe, or is accessible. Reviewers must open it and assess the evidence themselves.

Recommended sharing policy: tutors share with the assigned admin reviewer's Google account, rather than enabling "Anyone with the link." This better limits access but requires the team to identify the reviewer account and tutors to share with it. The team must confirm this policy. If the team chooses "Anyone with the link" for a simpler demo, explain that anyone who obtains the URL may view the document; do not describe that proof as private.

Never store a device-local `file://` URI, base64 file contents, or a Firebase Storage path. If a tutor cannot provide an accessible Drive link, retain the structured course details, leave `proofUrl` empty, and keep the application unreviewable until the evidence is accessible. Do not silently treat a missing or inaccessible proof link as verified.

Before publishing role-based rules, migrate existing tutor documents. Reviewing a pending legacy application moves its evidence to `tutorApplications/{uid}`. Admins can use **Migrate approved tutors** on the verification screen to move already-approved legacy evidence, remove it from the public profile, and set `publicProfileVersion: 2`. Approved profiles with an older version or private fields still attached are migrated; until then, they remain hidden from students.

## Things to know about queries

- A query that filters on one field and sorts on another, for example notifications where `recipientId` equals the user's id ordered by `createdAt`, needs a **composite index**. Firestore prints an error with a link in the console that creates it with one click.
- Firestore reads and writes cost per document, so listen to a small, filtered list (this user's bookings), never a whole collection.

## Open questions for Week 1

1. **Leaderboard:** the profile screen shows other students' names and points. Showing them needs rules that let one student read others' stats. Either keep a small public stats document per student, or drop the leaderboard from the real data.
2. **Real timestamps:** bookings keep `dateKey` and time text because the schedule screen is built on them. Reminders and sorting are easier with a real `startAt` timestamp. Member 2 decides whether to add it.
3. **Who creates notifications:** the app creates the notification document after a booking, message or verification write succeeds. Cloud Functions and scheduled functions are intentionally not used on the Spark plan. These alerts are best effort and are not a trusted audit log.
4. **Tier names:** some mock data says `Faculty` or `Faculty Tier`. The real data uses `Professor` only.
5. **Drive sharing policy:** confirm the admin reviewer's Google account and whether tutors must share only with that account or whether "Anyone with the link" is acceptable for the demo.
6. **Booking payment states:** Member 2 must confirm the exact `paymentStatus` values for the simulated payment flow; do not persist display labels such as "Escrow protected" unless the team agrees they are the canonical values.
