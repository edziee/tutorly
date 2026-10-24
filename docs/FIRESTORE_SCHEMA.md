# Firestore data structure (team review)

This schema is the team's working proposal for the Week 1 task "Design Firestore structure". It was drawn from the fields the mock data uses today (see [`MOCK_DATA_INVENTORY.md`](MOCK_DATA_INVENTORY.md)). The collection layout and role values are reflected in the app, but the team still needs to review the open decisions at the end of this document before calling the schema final. After agreement, changes go through Member 1 and are documented here in the same pull request.

The app is staying on Firebase's free Spark plan. It uses Firebase Authentication and Firestore only: do not use Firebase Storage, Cloud Functions, scheduled functions, or Firebase Extensions. Tutor verification evidence is a Google Drive URL plus structured metadata; file bytes are not uploaded to Firebase.

Collection names and fixed values also exist in code: `src/constants/collections.js`, `roles.js` and `statuses.js`.

## Collections at a glance

| Collection | One document is | Who writes it |
| --- | --- | --- |
| `users/{uid}` | An account of any role | The user (never the `role` after sign-up) |
| `tutors/{uid}` | Public profile fields students need to find and book a tutor, same id as their user | The applicant submits a pending profile; admin publishes approval |
| `tutorApplications/{uid}` | Private application evidence, same id as their user | The student or tutor applicant; admin reviews verification |
| `wallets/{uid}` | Private integer token balances for one account | Initialized by its owner or an admin; adjusted only by atomic booking transitions or an admin |
| `tokenTransactions/{id}` | Immutable audit record for one token movement | Admin or an atomic booking lifecycle transition |
| `bookings/{id}` | A session between a student and a tutor, including its token hold state | Student creates, tutor answers |
| `conversations/{id}` | A chat between one student and one tutor | Either person in the chat |
| `conversations/{id}/messages/{id}` | One message | Either person in the chat |
| `notifications/{id}` | One in-app alert for one user | The app, on events |

`{uid}` is the Firebase Authentication user id.

## `users/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | Firebase Authentication user id; matches the document id |
| `email` | string | |
| `role` | `'student'` \| `'tutor'` \| `'professional'` (legacy) \| `'admin'` | Set once at sign-up. Tutor accounts use `'tutor'`; newly created tutor accounts use the Professor / Alumni path. Existing peer tutor and `'professional'` accounts remain supported through the Tutor sign-in portal. A student applying to tutor keeps `role: 'student'`; application status is stored separately. Users must not be able to change their role, and nobody can sign up as `admin` (admins are created in the Firebase console) |
| `tutorType` | `'peer'` \| `'professional'` | Tutor accounts only. Saved at sign-up to determine the verification evidence requirements; never user-editable. Existing accounts without it infer the type from their tutor application tier |
| `tutorVerificationStatus` | `'pending'` \| `'approved'` \| `'rejected'` | Direct tutor sign-ups start pending and are reviewed by an admin using basic account details. This status alone does not create an approved public tutor profile or permit tutor operations |
| `tutorVerificationNote`, `tutorVerificationReviewedBy`, `tutorVerificationReviewedAt` | string, uid, timestamp | Admin-only outcome details for direct tutor account review. Rejection requires a reason |
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
| `hourlyRate` | number | The tutor's session price in tokens for one session. One token is nominally ₱1; values are limited to two decimal places. |
| `verificationStatus` | `'not_submitted'` \| `'pending'` \| `'approved'` \| `'rejected'` | `VERIFICATION_STATUS`. Students only see `approved` tutors |
| `verificationNote` | string | Public profile field; rejected tutors are not visible to students |
| `publicProfileVersion` | number | Must be `2` before students can read a profile. This keeps legacy documents containing proof fields private until migrated |

## `tutorApplications/{uid}` (private)

This document is readable only by its applicant and admins. Applicants may have a student, tutor, or legacy professional account role; applying never changes that role. Keep verification proof here, never in `tutors/{uid}`, because Firestore security rules cannot hide selected fields from clients that can read a document. A legacy payment QR value may remain in older private application records, but new records do not use the QR payment flow.

Tutor operations are granted only when both this private record and the matching `tutors/{uid}` public profile have `verificationStatus: 'approved'`, and the public profile has `publicProfileVersion: 2`. Pending and rejected applicants may see their own application status and evidence but cannot appear in tutor search, accept bookings, or update tutor booking details. A student applicant who is approved keeps all student access and may switch between student and tutor workspaces. Direct tutor sign-ups are tracked separately using `users/{uid}.tutorVerificationStatus`; account approval alone does not publish a public tutor profile or authorize tutor-only operations.

| Field | Type | Notes |
|---|---|---|
| `name`, `tutorType`, `tier`, `credentials` | string | Tutor application identity and category |
| `preferredDays`, `preferredTimeSlots`, `formats` | array of strings | Application preferences |
| `courses` | array of `{ id, code, title, grade, proofUrl?, proofName? }` | Peer tutors require eligible grades and course-level proof. Alumni/Professors may leave grades blank |
| `applicationProofName`, `applicationProofUrl` | string | Alumni/Professor proof description and HTTPS Google Drive URL |
| `teachingPhilosophy` | string | Tutor application text |
| `paymentQrUrl` | string | Legacy private field. New tutor applications do not collect QR payment details; retain only as needed for historical records |
| `verificationStatus`, `verificationNote` | string | Pending/approved/rejected status and rejection reason |
| `verificationReviewedBy`, `verificationReviewedAt` | string, timestamp | Admin reviewer and review time |
| `createdAt`, `updatedAt` | timestamp | |

## `wallets/{uid}` (private)

Wallets are readable only by their owner and admins. Balances are stored as
integer minor units to avoid floating-point arithmetic: 100 units equals one
token. `availableUnits` can be spent; `heldUnits` is reserved for active
bookings. Wallets are initialized lazily when an account opens its wallet;
admins can also initialize a target account's zero-balance wallet before an
adjustment. Signup does not create the wallet.

Only an admin can make manual credits/debits. A booking request requires the
student to have the full session price in available tokens, but does not move
tokens. The balance is checked again when the tutor accepts because it may
change while the request is pending. On acceptance, 20% of the session price
is charged to the student and held in the tutor's wallet; the remaining 80% is
held in the student's wallet. The deposit is rounded to the nearest 0.01 token
and the remainder is the exact difference from the full price. On completion,
the deposit is released and the full session price becomes available to the
tutor. If either participant cancels an accepted booking, the deposit is
refunded and the remaining held tokens are released. These transitions
atomically update wallets, booking state, and `tokenTransactions`. Wallet
documents are never directly deleted.

| Field | Type | Notes |
|---|---|---|
| `availableUnits`, `heldUnits` | non-negative integers | 100 units = 1 token = nominally ₱1 |
| `createdAt`, `updatedAt` | timestamp | |
| `lastTransactionId` | string, optional | Points to the most recent ledger event for this wallet |

## `tokenTransactions/{id}` (private, append-only)

Entries are readable by the wallet owner and admins. Clients cannot update or
delete ledger records. Admin credits and debits require a Google Form or
payment reference; a reason is optional. Booking ledger entries keep their
existing reason and use an empty form reference. The admin screen reuses one
operation id when retrying an adjustment, preventing duplicate credits after a
lost response. Top-ups and cash-outs themselves
remain external requests: an admin verifies them before recording a wallet
adjustment. The app does not process real-money payments or automatically
convert tokens to cash. The app applies no exchange fees; admins must disclose
any external fee before processing a request.

| Field | Type | Notes |
|---|---|---|
| `type` | string | Admin adjustments and booking acceptance, deposit hold/refund, cancellation refund, or settlement events |
| `accountId` | string | Wallet whose balance changed |
| `amountUnits` | positive integer | Absolute amount moved |
| `availableDelta`, `heldDelta` | integers | Exact change to the corresponding wallet balance |
| `actorUid` | string | Signed-in account that initiated the event |
| `reason`, `formReference` | string | Optional reason and required Google Form/payment reference on admin adjustments; booking events have a reason and empty reference |
| `bookingId` | string, optional | Present for booking lifecycle events |
| `createdAt` | timestamp | |

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
| `totalAmount` | number | Token amount for new bookings; legacy records retain their historical peso amount |
| `tokenAmountUnits` | positive integer | Full session price in minor units (100 units = 1 token) |
| `tokenDepositUnits` | positive integer | 20% of the session price, rounded to the nearest 0.01 token; present on new bookings |
| `tokenStatus` | `'pending'` \| `'not_charged'` \| `'reserved'` \| `'refunded'` \| `'settled'` | New requests do not move tokens; acceptance charges the deposit and holds the remainder, cancellation refunds, and completion pays the full price |
| `paymentStatus`, `tutorQrUrl`, `paymentReportedAt`, `paymentVerifiedAt` | legacy values | Retained only for historical peso bookings; new booking flow does not write QR payment fields |
| `tutorPhotoUrl` | string | Optional tutor photo copied to the booking when the tutor accepts; only booking participants and admins can read it |
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
| `data` | map | Where to go on tap, for example `{ bookingId }` or `{ conversationId, messageId }` for chat alerts |
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
6. **Token request forms:** set the student top-up and tutor cash-out Google Form URLs using the public Expo environment variables in `.env.example`. Admins must verify the external request and manually record any adjustment.

## Chat notification delivery

`sendMessage` commits the message and conversation preview together, then creates
one deterministic `new_message` notification using `data.conversationId` and
`data.messageId`. Retrying the same message ID does not duplicate the message or
reset an already-read alert. A notification failure is returned separately
from the successful message save. Opening the chat marks its alerts read.

Only recipients can list their alerts or change `read` to true. The sender can
get their own generated message alert by ID for retry deduplication. Chat
notification creation must reference a real message sent by the caller to the
other conversation participant. Client alerts remain best effort on Spark.