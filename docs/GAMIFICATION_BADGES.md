# Tutor-awarded student badges (proposal)

This document proposes an optional recognition feature for Tutorly. It is a
design artifact only: badges are not implemented, persisted, or shown by the
app yet. Review the catalog and behavior with the team before changing the
Firestore schema or application code.

## Purpose and principles

Badges let a tutor recognize a student's helpful learning behaviors after a
session. They are encouragement, not grades, credentials, or proof of academic
ability.

- Award badges only after a session is completed and confirmed.
- Make giving and receiving badges optional; never require one to finish a
  session or leave a review.
- Reward effort, curiosity, preparation, and collaboration—not a high grade,
  a positive review, spending tokens, or booking more sessions.
- Do not make badges redeemable for tokens, money, discounts, or ranking.
- Keep the badge catalog small and use consistent, non-judgmental language.
- Let students control whether badge notifications are enabled. Badges should
  not reveal private session details publicly.

## Suggested student badge catalog

Tutors choose from these predefined badges after a completed session. The
descriptions are shown to the student; the criteria are prompts for tutors,
not claims that the app can verify.

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

Avoid badges like “genius,” “perfect score,” or “top student.” They can imply
fixed ability, academic ranking, or outcomes outside a student's control.

## Suggested awarding experience

1. Once a booking is confirmed completed, the tutor may choose **Give a badge**
   or skip.
2. Show the catalog with each badge's description. The tutor selects one badge
   and may add a short, optional note (for example, a specific thing the
   student did well).
3. Show a confirmation screen before saving. Make clear the badge is
   encouragement and is visible to the student.
4. Notify the student only if they have enabled badge notifications. Show the
   badge in a private achievements area, not on a public profile by default.
5. If an award is already saved, show it as complete and prevent accidental
   duplicate submissions for that session.

Recommended first release: at most one tutor-awarded badge per completed
booking. This keeps the interaction quick and makes each award feel
intentional. The team should confirm this limit before implementation.

## Proposed integration contract

This is a suggested contract, not a committed schema. Keep the catalog as
application-owned static metadata; persist only awards.

Suggested award record:

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | string | Award document id |
| `badgeId` | string | Stable ID from the catalog above |
| `bookingId` | string | Completed session this award relates to |
| `tutorId` | string | Tutor who issued the award |
| `studentId` | string | Student receiving the award |
| `note` | string, optional | Short tutor-written explanation; apply length and content limits |
| `createdAt` | timestamp | Server-generated award time |

Possible Firestore location: `bookings/{bookingId}/badgeAwards/{awardId}`.
This keeps an award linked to its session. A student-facing service could
query awards by `studentId`; if Firestore query/index constraints make that
awkward, consider a top-level `badgeAwards/{awardId}` collection instead.
Choose one location with the Firebase/security-rules owner before
implementation; do not duplicate award records in multiple places.

Suggested service boundaries:

- `badgeService.awardStudentBadge({ bookingId, badgeId, note? })`: derive the
  tutor identity from the signed-in user rather than trusting a caller-supplied
  `tutorId`; validate the catalog ID, booking participants, completion status,
  and duplicate-award policy.
- `badgeService.subscribeToStudentBadges(studentId, callback, onError)`: allow
  the signed-in student to read their own awards and return an unsubscribe
  function.
- Tutor access should be limited to issuing an award for their own completed
  booking. Students may read their own awards; other students should not.

Firestore security rules must enforce these checks as well as the service:
client-side validation alone is not authorization. The write should be
immutable after creation unless the team defines a moderation or correction
flow. Validate and limit the optional note, and do not store session chat,
grades, or other sensitive details in an award.

## Decisions before implementation

- Confirm the badge names, descriptions, and whether tutors can award one or
  more badges per session.
- Decide whether students can hide an award and whether tutors can correct an
  accidental award.
- Choose the Firestore location and agree on indexes and rules with the Firebase
  owner.
- Decide whether badge notifications use the existing notification service and
  preference settings.
- Add tests for valid completed-session awards, unauthorized tutors, incomplete
  bookings, invalid badge IDs, duplicate writes, and private student reads.

## Integration touchpoints

- Booking completion: `src/services/bookingService.js`
- Firebase access and authorization: service layer and `firebase-rules/`
- Student display: profile or a dedicated achievements section in
  `src/screens/student/`
- Tutor award action: completed-session details in the tutor workspace
- Data contract and schema: update `docs/SCREEN_DATA_CONTRACTS.md` and
  `docs/FIRESTORE_SCHEMA.md` only when implementation is approved
