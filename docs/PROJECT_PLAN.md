# Tutorly 3-Week Plan

Oct 10, 2026

> This is the markdown copy of the Claude Doc "Tutorly 3-Week Plan", kept in the repo so the team can update task statuses in the same place as the code. The progress section, the status of tasks the repo already covers, and the open questions were updated on Oct 10, 2026 after reading the GitHub repo. Swap the member names in for "Member 1 to 4".

## Overview for the team

Tutorly is a student and tutor app, and the design is finished, so the next three weeks are about building it. Besides the screens from Figma, the project must include three things:

- **Database:** Firebase stores users, tutors, bookings, messages and notifications.
- **In-app notifications:** the app shows alerts inside the app, such as a new booking request or a new message.
- **Geolocation:** the app uses the phone's location to show tutors on a map and to check in at campus.

The app serves four types of users. The last two are new in this plan, and each has its own login and its own dashboard, different from the student dashboard:

- **Students:** the existing student login and student dashboard.
- **Tutors:** the existing tutor login and tutor profile.
- **Professional tutors (professors and alumni):** a new login option and a new professional tutor dashboard.
- **Admin:** a hidden login that normal users never see, and a new admin dashboard.

The GitHub repo currently contains mock data. All of it must be replaced with real Firebase data by the end of Week 3, and every member is responsible for the mock data in their own area. The full list is in [MOCK_DATA_INVENTORY.md](MOCK_DATA_INVENTORY.md).

Each of you owns one area, listed below. In Week 1 we build the foundation, in Week 2 we connect real Firebase data and the required features, and in Week 3 we join everything, test it and submit. When you finish a task, change its status in the tables below so everyone can see progress.

## Progress so far

The Figma prototype is done (16 screens). The code in the repo (`edziee/tutorly`, one commit so far) is a React Native app built with Expo that covers part of the student side using mock data.

**Done: UI prototype in Figma**

- Student sign-up/login (2 screens)
- Student dashboard, new user and existing user
- Tutors list view and map view
- Booking a tutor (2 screens)
- Payment
- Chat (person-to-person and chat interface)
- Schedule
- Eligibility check for tutors
- Tutor sign-up/login (2 screens)
- Tutor profile
- Already designed in the prototype: a toast notification, notification preferences, a live session geolocation check-in tool, and a campus proximity setting

**Already coded in the repo (all on mock data)**

- Splash screen and two-page onboarding (the onboarding is marked to be edited later)
- Student navigation with five tabs: Tutors, Profile, Schedule, Tutor Profile, Messages
- Tutors list with search, course filter and tier filter
- Schedule with upcoming and past sessions, reschedule, add to calendar, and session reminders saved on the device
- Messages screen
- Student profile with personal information, streak, leaderboard and honors
- Tutor application with courses, grades and proof file selection
- Shared theme (colors, spacing, typography) and reusable components, still to be completed to match Figma

**Not coded yet:** login and sign-up for any role, booking flow, payment, tutors map view, geolocation, in-app notifications (the header bell only shows a placeholder), Firebase, the professional tutor dashboard and the admin dashboard.

**Not yet designed:** the professional tutor login, the hidden admin login, and the professional tutor and admin dashboards. They are added as Figma tasks in Week 1. The repo's mock data is tracked as tasks in all three weeks.

## Distribution of parts

The four members split the work by area. Member 3 builds the screens and customizes the UI for everyone, and the member who owns a feature connects its screens to Firebase.

| Member | Area | Main responsibilities |
| --- | --- | --- |
| Member 1  (Marcus)| Firebase setup, logins for all roles, security | Firebase project on the free Spark plan, Authentication logic for students, tutors, professional tutors (professors and alumni) and the hidden admin login, role-based access, profile data, verification proof metadata and approved external URLs, eligibility check, connecting the professional tutor dashboard to Firestore, Firestore security rules, mock data in login, profiles and that dashboard |
| Member 2  (Adrian)| Student features, booking, payment and geolocation | Tutors list search and filter logic, booking flow, schedule, payment, Firestore booking data, geolocation in Week 3 (location permission, tutors on the map, nearby tutors, campus proximity check-in), mock data in these features |
| Member 3  (Edrian)| Front end and UI customization | Fully customizing the UI to match Figma (theme, colors, fonts, reusable components), building the screens for all four user types, the Figma designs for the four new screens, loading, empty and error states, final UI polish and the Figma comparison |
| Member 4  (Michael)| In-app notifications, chat and admin | Chat and notification data and logic, real-time chat, notification triggers and preferences, admin dashboard data (users, verification approvals), mock data in chat, notifications and admin, plus final documentation and demo |

## What each member should do

### Member 1: Firebase setup, logins for all roles and security

- **Week 1:** create the Firebase project on the free Spark plan, turn on Authentication and Firestore, and share the config with everyone. Do not enable Storage or add Cloud Functions. Agree with the team on the collections (users, tutors, bookings, messages, notifications) and on a role field for each user: student, tutor, professional or admin. Build the sign-up and login logic for students and tutors. Make the list of every place in the repo that uses mock data.
- **Week 2:** build the professional tutor login logic (professors and alumni) and the hidden admin login, and make each role open its own dashboard. Save profiles to Firestore, let tutors submit structured verification details and a Google Drive proof URL, and build the eligibility check. Connect the professional tutor dashboard (built by Member 3) to Firestore. Replace the mock data in the login, profile and professional dashboard screens.
- **Week 3:** write the security rules so each role can only reach its own data, and coordinate the final mock-data sweep.
- **Done when:** all four roles can log in and land on the right dashboard, profiles and the professional dashboard use Firestore data, and no mock data is left in those screens.

### Member 2: Student features, booking, payment and geolocation

- **Week 1:** build the tutors list logic with search and filters. Temporary data is fine for now and gets replaced in Week 2. Member 3 builds the screens.
- **Week 2:** build the booking flow and the schedule and save bookings to Firestore. Connect the student dashboard and tutors list to Firestore, and replace their mock data, along with the booking and schedule mock data.
- **Week 3:** connect the payment screen to bookings using an in-app booking QR flow. Generate a QR payload containing the booking id, amount and currency; let the student scan or display it and tap "I've paid" to submit a simulated payment claim. Do not integrate a real payment provider or treat the claim as verified money transfer. Then build geolocation: ask for location permission, show tutors on the map using Firestore location data, sort tutors by distance, and add the session check-in that uses the campus proximity check from the prototype.
- **Done when:** a student can find a tutor, book a session and see it in their schedule from Firestore data, the map shows tutors with nearby ones first, and check-in works only at the campus location.

### Member 3: Front end and UI customization

- **Week 1:** set up the shared UI theme (colors, fonts, spacing) and the reusable components (buttons, inputs, cards, navigation) so they match Figma. Build the login and sign-up screens, the student dashboard and the tutors list. Design in Figma the four new screens: the professional tutor login, the hidden admin login, the professional tutor dashboard and the admin dashboard.
- **Week 2:** build the booking, schedule, payment and chat screens, the tutors map view and session check-in screens, the notification bell and toast, the professional tutor login and dashboard, and the hidden admin login and admin dashboard. Add loading, empty and error states to every screen.
- **Week 3:** fully customize and polish the UI: spacing, animations, responsive layout and consistency across all four user types. Compare the app with Figma and fix mismatches.
- **Done when:** every screen for all four user types looks like the Figma design and uses the shared components, and the other members can connect data without changing the layout.

### Member 4: In-app notifications, chat and admin

- **Week 1:** set up the Firestore data and logic for chat and notifications (messages and notifications collections, and when a notification is created). Member 3 builds the screens.
- **Week 2:** make chat work in real time with Firestore, and create notifications when a booking is requested or accepted, a session reminder is due, or a new message arrives. Connect the admin dashboard (built by Member 3) to Firestore: users list, approve or reject tutor and professional verification, and bookings overview. Replace the mock data in chat, notifications and the admin dashboard.
- **Week 3:** add notification preferences and read/unread states, notify tutors in the app when an admin approves or rejects their verification, then coordinate the documentation and demo.
- **Done when:** a message or booking request shows a notification to the other user inside the app, and an admin can approve or reject a tutor or professional verification.

### Working together

- Use the GitHub repo and commit often, preferably with a separate branch per member (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
- Update your task status in the tables below when you start and finish.
- Member 3 builds the screens and the member who owns a feature connects them to Firebase, so agree on screen names and data fields early so the two parts fit.
- Replace mock data in your own area as you build it, and do not add new mock data.
- Tell the team early if you are blocked, especially Members 2 to 4 waiting on Member 1's Firebase setup.

## Week 1 (Oct 10 to 15): Foundation and core screens

Week 1 sets up Firebase and the shared data structure first, because everything else depends on it. Member 3 starts the shared UI and designs the four new Figma screens, and the other members build their logic with temporary data. The team also lists every place in the repo that uses mock data.

| Task | Owner | Status |
| --- | --- | --- |
| Figma prototype, all 16 screens | Everyone | Done |
| Create Firebase project, connect it to the app, share config with the team | Member 1 | Not started |
| Design Firestore structure (users with a role field, tutors, bookings, messages, notifications) | Member 1 (with all) | In progress — schema proposal documented in [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md); team review and open decisions remain |
| List every file and screen in the repo that uses mock data, and which Firestore collection will replace it | Everyone (Member 1 compiles) | Draft ready in [MOCK_DATA_INVENTORY.md](MOCK_DATA_INVENTORY.md), team to review |
| Sign-up and login logic for students and tutors | Member 1 | Not started |
| Set up the shared UI theme and reusable components to match Figma | Member 3 | In progress (theme, form, card, badge, filter and state components are in; `ScreenHeader` and `SessionCard` are still empty) |
| Build the UI for login and sign-up, the student dashboard and the tutors list | Member 3 | Done on branch `member3/ui-screens` (login, sign-up and dashboard built and waiting for review; tutors list already existed). Google login and "Forgot password" are left out until Member 1 has service functions for them. The dashboard is registered but no button opens it yet |
| Design in Figma: professional tutor login and hidden admin login | Member 3 | Done |
| Design in Figma: professional tutor dashboard and admin dashboard | Member 3 | Done |
| Tutors list logic with search and filters (temporary data is fine for now) | Member 2 | In progress (search and filters exist on mock data) |
| Firestore data and logic for chat and notifications | Member 4 | Not started |

## Week 2 (Oct 16 to 22): Firebase features

Week 2 connects each area to real Firebase data and builds the two new logins and dashboards. Member 3 builds the remaining screens, and each member replaces the mock data in their own area.

| Task | Owner | Status |
| --- | --- | --- |
| Student and tutor profiles save to and load from Firestore | Member 1 | Done — verified by signing out and back in; saved student profile and tutor application persisted |
| Tutor verification proof metadata/URL and eligibility check | Member 1 | Done — both types list courses and submit Google Drive proof; Peer Tutors require grades 1.00–1.50 and per-course proof, while Alumni/Professors submit one application-level proof and may omit grades |
| Build the professional tutor login logic (professors and alumni) with its verification documents | Member 1 | Done — professors and alumni use the shared tutor sign-up/login; sign-up type is saved and determines the application evidence requirements |
| Build the hidden admin login (no public sign-up; admin accounts created by the team in Firebase) | Member 1 | Done — admin accounts are created in Firebase, and admin sign-in verifies the Firestore role; Firestore security rules are a separate Week 3 task |
| Role-based access: each role (student, tutor, professional tutor, admin) opens its own dashboard | Member 1 | Not started |
| Connect the professional tutor dashboard to Firestore and replace mock data in the login, profile and professional dashboard screens | Member 1 | In progress — the shared tutor dashboard profile/application summary reads from Firestore for Peer Tutors, Alumni and Professors, including category, proof details and availability. Booking requests and session panels still show mock data; booking/schedule integration belongs to Member 2 and chat integration belongs to Member 4 |
| Booking flow and schedule saved to Firestore | Member 2 | Not started (schedule screen exists on mock data and device storage) |
| Connect the student dashboard and tutors list to Firestore and replace mock data in them, in booking and in the schedule | Member 2 | Not started |
| Build the booking, schedule, payment and chat screens | Member 3 | In progress (schedule and chat screens exist; booking and payment not built) |
| Build the professional tutor login and dashboard, the hidden admin login and the admin dashboard | Member 3 | In progress (admin dashboard, users, verifications and bookings screens built on branch `member3/ui-screens`; professional login and dashboard and the admin login are not built) |
| Build the tutors map view and session check-in screens, and the notification bell and toast | Member 3 | In progress (notifications screen and the bell in every role's header are built; map view, check-in and the toast are not) |
| Add loading, empty and error states to every screen | Member 3 | In progress (done for the screens built in this branch: login, sign-up, dashboard, notifications and the 4 admin screens; the older screens still need them) |
| Real-time chat using Firestore | Member 4 | Not started |
| In-app notifications triggered by booking events (requested, accepted, reminder) and new messages | Member 4 | Not started |
| Connect the admin dashboard to Firestore (users list, approve or reject tutor and professional verification, bookings overview) | Member 4 | Not started |
| Replace mock data in chat, notifications and the admin dashboard | Member 4 | Not started |

## Week 3 (Oct 23 to Oct 28): Integration, polish and submission

Week 3 adds payment and geolocation, locks down Firebase for each role, finishes the UI polish, removes any mock data that is left, and leaves time for testing and the demo.

| Task | Owner | Status |
| --- | --- | --- |
| Payment screen flow connected to bookings with an in-app booking QR and student self-claim | Member 2 | Not started |
| Geolocation: location permission, tutors on the map from Firestore location data, nearby-tutor sorting by distance | Member 2 | Not started |
| Session check-in using campus proximity (location check) | Member 2 | Not started |
| Fully customize and polish the UI: spacing, animations, responsive layout, consistency across all four user types | Member 3 | Not started |
| Compare the finished app to the Figma design and fix mismatches | Member 3 (with everyone) | Not started |
| Notification preferences and read/unread states | Member 4 | Not started |
| Notify tutors in the app when an admin approves or rejects their verification | Member 4 | Not started |
| Firestore security rules so each role only reaches its own data (admin data only for admins) | Member 1 | Drafted and checked in the Firestore Emulator; not yet reviewed or published |
| Final mock-data sweep: search the whole repo for mock or sample data files and fake values, delete them, and confirm every screen loads real Firestore data | Everyone (Member 1 coordinates) | Not started |
| Full app testing with accounts for all four roles (student, tutor, professional tutor, admin) and bug fixes | Everyone | Not started |
| Documentation, demo script and submission | Member 4 (coordinates) | Not started |

## Notes and open questions

Week 1 comes first because Members 2, 3 and 4 need Member 1's Firebase setup and data structure before they can use real data.

- **Notifications:** only in-app notifications are required, so they can be Firestore documents shown in the app in real time; push notifications are not needed. The repo already schedules local session reminders with `expo-notifications`, which is separate from this requirement.
- **Payment:** use an in-app booking QR as the demo workaround instead of a real payment provider. The QR must contain only non-sensitive booking data (version, booking id, amount and currency). After scanning or displaying the QR, the student may tap "I've paid"; this records a simulated claim only and does not verify that money was transferred. Use canonical stored statuses such as `unpaid`, `paid` and `released`, mapping them to user-facing labels in the screens.
- **Geolocation timing:** geolocation is in Week 3, so there is less time to fix problems. If Member 2 finishes early in Week 2, start the Maps setup then.
- **Front end:** Member 3 builds and customizes the screens for everyone. The member who owns a feature connects its screens to Firebase.
- **Hidden admin login:** it should not appear on the normal login screens. Admin accounts are created by the team directly in Firebase, and the security rules in Week 3 must block everyone else from admin data.
- **Mock data:** the list of mock data is made in Week 1 ([MOCK_DATA_INVENTORY.md](MOCK_DATA_INVENTORY.md)) and checked again in the Week 3 sweep. Starter records saved in Firestore (for example test accounts) are real database data, not mock data.
- **Week dates:** weeks are assumed to run Oct 10 to 18, Oct 19 to 25 and Oct 26 to Nov 1.
- **Open question:** what is the actual submission deadline?
- **Resolved:** the stack is React Native with Expo (SDK 57), and the GitHub repo is readable, so finished code tasks can be marked Done in the tables above.
