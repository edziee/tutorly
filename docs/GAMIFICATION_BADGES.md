# Student badges and tutor achievements

This is the implemented first-release contract for optional student recognition
and private tutor milestones. Catalog text is application-owned; Firestore
stores awards and earned achievement records, not copies of catalog text.

## Principles

- Award student badges only after a booking is confirmed completed; awarding is
  optional and never required to complete a session or submit a review.
- Recognize effort, curiosity, preparation, and collaboration—not grades,
  positive reviews, token earnings, or booking volume.
- Badges have no token, money, discount, ranking, or other benefit.
- Keep awards and display preferences private to their owners. They are not
  shown on public profiles or in leaderboards.
- Do not send badge notifications in the first release: notification
  preferences are not implemented.

## Student badge catalog

Tutors choose from these predefined badges after a completed session. The
descriptions are shown to students; selection remains the tutor's optional
recognition, not an app-verified academic claim.

| ID | Badge | Student-facing description | Award when the student... |
| --- | --- | --- | --- |
| `curious_mind` | Curious Mind | Asked thoughtful questions and explored the topic. | Showed curiosity or explored ideas beyond the first answer. |
| `prepared_learner` | Ready to Learn | Came prepared with materials, questions, or a clear goal. | Arrived prepared in a way that helped the session. |
| `persistent_effort` | Kept Going | Stayed engaged through a challenging concept. | Tried different approaches or kept working when the material was difficult. |
| `big_step` | Breakthrough Moment | Made progress on a concept or skill during the session. | Demonstrated a new understanding or meaningful step forward. |
| `clear_communicator` | Clear Communicator | Shared ideas and questions clearly. | Explained their thinking or communicated what they needed help with. |
| `great_collaborator` | Great Collaborator | Worked actively with the tutor to solve problems. | Listened, contributed, and built on ideas together. |
| `creative_thinker` | Creative Thinker | Tried an original approach or made a useful connection. | Connected the topic to another idea or tried a different strategy. |
| `practice_pro` | Practice Pays Off | Put in focused effort while practicing. | Worked through examples or exercises with care. |
| `goal_getter` | Goal in Sight | Made progress toward a learning goal. | Worked toward a goal they identified for the session. |
| `brave_beginner` | Brave Beginner | Took a positive first step into a new topic. | Tried an unfamiliar topic or asked for help getting started. |
| `thoughtful_reflector` | Thoughtful Reflector | Reflected on what they learned and what to try next. | Summarized a takeaway or identified a next step. |
| `kind_and_respectful` | Kind and Respectful | Helped make the session welcoming and respectful. | Contributed to a considerate, constructive learning environment. |

## Tutor achievement catalog

Tutor achievements are distinct from tutor-awarded student badges. They are
earned from qualifying app activity, not issued by tutors or students.

| ID | Badge | Tutor-facing description | First-release status and criterion |
| --- | --- | --- | --- |
| `first_lesson` | First Lesson | You completed your first tutoring session on Tutorly. | Implemented: 1 confirmed completed booking |
| `steady_mentor` | Steady Mentor | You have consistently supported learners over time. | Implemented: 10 confirmed completed bookings |
| `experienced_guide` | Experienced Guide | You have built a strong record of completed sessions. | Implemented: 25 confirmed completed bookings |
| `hours_of_impact` | Hours of Impact | Your teaching time has added up to a meaningful milestone. | Implemented: 10 confirmed teaching hours |
| `reliable_tutor` | Reliable Tutor | You consistently follow through on accepted sessions. | Deferred; cancellation window and exclusions are undefined |
| `clear_explainer` | Clear Explainer | Students have shared that your explanations helped them. | Deferred; feedback safeguards and moderation are undefined |
| `welcoming_mentor` | Welcoming Mentor | You help create a respectful and encouraging learning environment. | Deferred; requires moderated feedback and appeals |
| `multi_subject_mentor` | Multi-Subject Mentor | You support learners across several approved subjects. | Deferred |
| `community_mentor` | Community Mentor | You have helped learners make progress over multiple terms. | Deferred; time period and evidence are undefined |
| `profile_complete` | Ready to Teach | Your approved profile helps students understand your tutoring offer. | Private checklist only; not a permanent achievement |

No tutor achievement is based on star ratings, requested bookings, token
earnings, or student grades. No public leaderboard is added.

## First-release experience

After a booking is confirmed completed, its tutor may choose one student badge
or skip. The tutor can add a brief optional note (maximum 280 characters); the
award form warns not to include grades, chat, or sensitive session details. A
confirmation action precedes saving. Session completion and reviews do not
depend on an award. If an award exists, the tutor sees it as complete and
cannot submit a second award for that booking.

Students see awards in their private profile and can show or hide each award
at any time. Tutor achievements appear separately in the tutor's own private
profile; tutors can show or hide each earned achievement at any time. Missing
visibility preferences default to shown. Hiding an item changes only its
preference and never edits, deletes, revokes, or requalifies its source record.

## Firestore and security contract

### Student awards

One immutable record lives at
`bookings/{bookingId}/badgeAwards/award`. The deterministic path enforces one
award per booking. It stores `badgeId`, `bookingId`, `tutorId`, `studentId`,
optional `note`, and server `createdAt`; it does not store grades, chat, or
copied session details. The service derives tutor identity from Firebase Auth.
The service and Firestore rules both require the authenticated user to be the
assigned approved tutor and the booking to be completed. Rules also validate
the catalog ID, booking recipient, note length, and server timestamp. Awards
are readable only by the recipient and awarding tutor; unrelated users cannot
read them.

Student display preferences are separate:
`users/{uid}/studentBadgeVisibility/{bookingId}` contains a `visible` boolean.
Rules require the referenced award to exist and belong to the signed-in
student. Neither awards nor preferences are exposed from public profiles.

### Tutor achievements

An immutable earned record lives at
`tutorAchievements/{tutorId}_{badgeId}` with `badgeId`, `tutorId`,
`qualifyingBookingId`, `criterionVersion: 1`, and server `createdAt`. The
deterministic ID prevents duplicates. The record is created in the same
transaction that confirms the qualifying booking. Rules allow creation only
when the linked upcoming booking changes to completed, the rules-guarded
private counter or teaching-seconds aggregate crosses that badge's threshold,
and the signed-in tutor is the assigned approved tutor. Tutors cannot create
arbitrary achievements or grant them to themselves outside that qualifying
transition.

`users/{uid}.tutorCompletedBookingCount` and
`lastTutorCompletedBookingId` are private, rules-guarded fields. Each
completion increments the counter exactly once as part of the existing atomic
booking transition. Count milestones are created only when crossing 1, 10, or
25. The 10-hour milestone uses
`tutors/{uid}.totalRecordedTeachingSeconds` and `lastTeachingBookingId`, which
the existing completion rules update atomically from that same booking. If
the existing confirmed-time total already meets 10 hours before release, the
achievement is materialized with the tutor's next valid completed booking;
the Spark-only app has no trusted background worker to backfill an immutable
achievement without that transition.

Tutor display preferences are separate:
`users/{uid}/tutorAchievementVisibility/{badgeId}` contains a `visible`
boolean. Rules require the corresponding earned record. Source records and
visibility settings are private; clients cannot update or delete source
records or delete preference records.

The new completed-booking counter starts at zero on release. There is no
client-side historical backfill, so booking-count milestones count qualifying
completions after rollout rather than a tutor's pre-release history. This
avoids inventing past completions from client input. Teaching hours use only
positive timer-recorded seconds on confirmed completed sessions, never the
scheduled `durationHours`. Existing confirmed-time totals count toward
eligibility, but an already-qualified tutor receives the immutable record on
their next valid completion rather than through an automatic backfill.
Firestore rules validate timer state and completion coupling, but the
Spark-only client timer cannot attest that teaching physically occurred;
recorded time is an auditable product signal, not server-attested time.

## Deferred reporting and rollout

Awards and achievements are immutable. An in-app correction/reporting path is
deferred because the app has no support-report intake or admin moderation and
appeal workflow. Clients cannot correct or revoke source records; do not
represent an in-app appeal as available until a reviewed correction workflow
exists.

Production deployment remains a release blocker: the root `firebase.json`
does not select a Firestore rules file, while the main rules and separate chat
test rules have different chat access behavior. The intended production
ruleset must be confirmed and deployed before these protections can be relied
on in production. Emulator tests explicitly load the main
`firebase-rules/firestore.rules`.

## Local UI testing without a Firebase deployment

The app can be explicitly routed to the local Auth, Firestore, and Storage
emulators. Emulator mode forces the Firebase project ID to
`demo-tutorly-badges`, uses emulator-only config values, and is rejected in a
production build. It does not connect to or write to the cloud Firebase
project configured for normal app use.

1. In one PowerShell terminal, start the local services:

```powershell
npm run emulators:badges
```

2. In a second terminal, enable emulator mode and run the app:

```powershell
$env:EXPO_PUBLIC_USE_FIREBASE_EMULATORS = 'true'
$env:EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = '127.0.0.1'
npx expo start --web --clear
```

For a physical device, set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to the
development computer's LAN IP instead of `127.0.0.1`; the device and computer
must be on the same reachable network. Android emulators can use
`10.0.2.2`; web and iOS simulators can use `127.0.0.1`. Emulator ports are
Auth `9099`, Firestore `8080`, and Storage `9199`.

3. In a third terminal, create/reset the isolated sample users and booking:

```powershell
npm run seed:badges
```

Sign in through the app with the printed demo tutor credentials. Open Tutor
Schedule, select today's demo session, open its details, and confirm
completion. The seed booking has a positive, stopped 10-hour timer record and
is reset to upcoming by the seed script. The tutor should earn
`first_lesson` and `hours_of_impact`, then can award a student badge from
Tutor Profile. Sign out and sign in with the printed student credentials to
see the received award and test its show/hide control.

The seed script uses the emulator's owner-only REST shortcut to prepare
approved demo accounts; it never contacts production. Do not reuse the printed
credentials outside local emulators. Restarting the emulators clears their
data; run the seed script again when needed. Emulator UI tests exercise the
actual app screens and badge flows, while `npm run test:gamification` checks
the rules and service authorization.

Run the focused service/rules integration tests separately with:

```powershell
npm run test:gamification
```
