# Mock data inventory

This covers the Week 1 task "List every file and screen in the repo that uses mock data, and which Firestore collection will replace it". It was made by reading the repo on Oct 10, 2026. By the end of Week 3 all of it must be replaced with real Firebase data (see [PROJECT_PLAN.md](PROJECT_PLAN.md)).

The collection names below come from the plan (users with a role field, tutors, bookings, messages, notifications). Member 1 confirms the final structure in Week 1, so treat the right-hand column as a proposal.

## Mock data files in `src/data/`

| File | What it holds | Used by | Replaced by | Owner |
| --- | --- | --- | --- | --- |
| `mockTutors.jsx` | 7 tutors: name, tier, subject, rating, hourly rate, location, availability, online flag | `TutorsScreen`, `ChatScreen`, `mockMentorApplication` | `tutors` | Member 2 (tutors list), Member 4 (chat) |
| `mockSchedules.jsx` | Sample sessions with date, time, status, location, total, payment status | `ScheduleScreen` | `bookings` | Member 2 |
| `mockConversations.jsx` | Chat conversations linked to tutors | `ChatScreen` | `messages` | Member 4 |
| `mockStudentProfile.jsx` | Student name, contact, campus, streak, level, study hours, leaderboard, honors | `StudentProfileScreen`, `StudentNavigator` (header initials) | `users` | Member 1 |
| `mockMentorApplication.jsx` | Tutor application: credentials, preferred days, courses with grades and proof file names, philosophy | `TutorProfileScreen` | `users` (tutor profile) and Storage for proof files | Member 1 |
| `mockNotifications.jsx` | Two sample notifications | Nothing yet | `notifications` | Member 4 |
| `courseCategories.jsx` | Subject filter chips | `TutorsScreen` | Can stay as app configuration, or be built from the subjects in `tutors` | Member 2 |
| `tierCategories.jsx` | Tier filter chips (All, Professors, Alumni, ...) | `TutorsScreen` | Same as above | Member 2 |

The two category files are filter options, not fake records. Decide in Week 1 whether they count as mock data for the Week 3 sweep, and write the decision here.

## Fake values written directly in screens

Some sample values are typed into the screens instead of coming from `src/data/`. Check these in the final sweep:

| Where | Value | Notes |
| --- | --- | --- |
| `src/screens/ChatScreen.jsx` | Tutor name "Marcus" in a switcher | Should come from the logged-in user's tutor list |
| `src/screens/TutorProfileScreen.jsx` | Rate "₱250.00" and "+ ₱50.00 / hr" overtime | Should come from the tutor's own rate |
| `src/screens/StudentProfileScreen.jsx` | "Earn ₱200 - ₱300/hr" | Marketing text, may stay |
| `src/components/TutorCard.jsx` | "+₱50/hr overtime option" | Should come from tutor data |
| `src/screens/StudentProfileScreen.jsx` | Study space preference and automated reminder settings | Check whether these are saved anywhere |

## Local storage that is not mock data

`ScheduleScreen` saves the session list on the device with AsyncStorage. After bookings move to Firestore, this should become only a cache or be removed so the device and the database do not disagree.

## Final sweep checklist (Week 3)

- [ ] Search the repo for `mock`, `sample`, `dummy` and `fake` and delete every file or value that is left
- [ ] Search for tutor and student names from the files above ("Marcus Chen", "John Doe", and so on)
- [ ] Search for hardcoded prices and times in screens and components
- [ ] Delete `src/data/mock*.jsx` and confirm the app still builds and every screen loads from Firestore
- [ ] Log in with an account for each role (student, tutor, professional tutor, admin) and confirm no sample data shows
- [ ] Test with an empty database to confirm the empty states look right

Starter records saved in Firestore (for example test accounts) are real database data, not mock data.
