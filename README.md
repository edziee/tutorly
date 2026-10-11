# Tutorly

Tutorly is a mobile app that connects students with tutors. Students find a tutor, book a session, chat and keep a schedule. Tutors apply, get verified and run their sessions. The app is built with React Native and Expo, and this is a group project by a team of four.

The design lives in Figma: [TUTORLY prototype](https://www.figma.com/design/BCpvrQFfmymLF1r5WvcjPW/TUTORLY). The work plan is in [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md).

## What the app must have

Besides the screens from the Figma prototype, the project requires three things:

| Requirement | What it means in Tutorly |
| --- | --- |
| Database | Firebase (Authentication, Firestore, Storage) stores users, tutors, bookings, messages and notifications |
| In-app notifications | Alerts shown inside the app, such as a new booking request or a new message |
| Geolocation | The phone's location shows tutors on a map, sorts nearby tutors first and checks a student in at campus |

The app serves four types of users, each with its own dashboard:

- **Students**: student login and student dashboard
- **Tutors**: tutor login and tutor profile
- **Professional tutors** (professors and alumni): new login option and new dashboard
- **Admin**: hidden login that normal users never see, and a new admin dashboard

## Current status

Last updated on Oct 11, 2026, after the files were organized for the team. The repo is at its first stage: the interface exists, but everything still runs on mock data.

| Area | State |
| --- | --- |
| Splash screen and two-page onboarding | Built (the onboarding is marked to be edited later) |
| Student app with five tabs: Tutors, Profile, Schedule, Tutor Profile, Messages | Built with mock data |
| Tutors list with search and course and tier filters | Built with mock data |
| Schedule with upcoming and past sessions, reschedule, add to calendar | Built with mock data, saved on the device only |
| Messages screen | Built with mock data |
| Tutor application (grades, courses, proof upload) | Built, the proof upload picks a file but keeps it only in the screen's state, nothing is stored |
| Shared theme and reusable components | Started in `src/theme` and `src/components` |
| Login and sign-up (student, tutor, professional tutor, admin) | Not built. Placeholder screens, the role navigators and `AuthContext` are in place |
| Professional tutor dashboard and admin dashboard | Not built, not yet designed in Figma. Placeholder screens are in place |
| Booking flow and payment | Not built. Placeholder screens and the `bookingService` function list are in place |
| Firebase | The `firebase` package and the connection file `src/config/firebase.js` are in, but not connected: the Firebase project and `.env.local` are not set up yet (Member 1, Week 1) |
| In-app notifications | Not wired up. The bell in the header shows a placeholder alert. `NotificationCard` is built but no screen uses it yet |
| Geolocation and map | Not built. `expo-location` is installed and the distance helpers are in `src/utils/distance.js`. The map library is not chosen yet |

The full list of mock data is in [`docs/MOCK_DATA_INVENTORY.md`](docs/MOCK_DATA_INVENTORY.md).

## Tech stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57 with React Native 0.86 and React 19
- React Navigation (bottom tabs and native stack)
- Expo modules in use: `expo-calendar`, `expo-document-picker`, `expo-image-picker`, `expo-notifications`, `expo-font`, `expo-location`
- `@react-native-async-storage/async-storage` for data kept on the device
- Firebase JS SDK (`firebase` 12) for Authentication, Firestore and Storage. It runs in Expo Go
- Still to decide: a map library (see [`docs/members/MEMBER_2_STUDENT_FEATURES.md`](docs/members/MEMBER_2_STUDENT_FEATURES.md))

Expo has changed a lot between versions. Before writing code, check the [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) instead of relying on older tutorials. This is also noted in `AGENTS.md` for AI coding tools.

## Getting started

You need [Node.js](https://nodejs.org/) (a current LTS version) and npm. For a phone, install Expo Go or use an emulator.

```bash
git clone https://github.com/edziee/tutorly.git
cd tutorly
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for the web, or scan the QR code with Expo Go. The same can be started directly with `npm run android`, `npm run ios` or `npm run web`.

Run `npm test` to run the tests for the distance helpers in `src/utils` (needs Node 22 or newer).

Known limits when running:

- Session reminders use `expo-notifications` and are turned off in Expo Go and on the web (the code skips them there). Test them in a development build.
- `expo-calendar` and the image and document pickers need a real device or an emulator with those apps.

### Firebase configuration (when Firebase is added)

Do not commit Firebase keys or any secret. Copy `.env.example` to `.env.local` and fill in the values from the Firebase console, then restart Expo with `npx expo start -c` because Expo only reads the variables when it starts. Files named `.env*.local` are already ignored by git. Expo loads variables that start with `EXPO_PUBLIC_` automatically, and they are readable in the built app, so keep real secrets (such as admin credentials) out of them. Access to data is protected by Firestore and Storage security rules, not by hiding the config.

The app opens without these values (`isFirebaseConfigured` in `src/config/firebase.js` is then `false`), so members who have not set Firebase up yet can still work on screens.

Cloud Storage for Firebase needs the paid Blaze plan, while Authentication and Firestore work on the free Spark plan. The team must decide this in Week 1, see "Decision: Firebase Storage" in [`docs/members/MEMBER_1_FIREBASE_AND_AUTH.md`](docs/members/MEMBER_1_FIREBASE_AND_AUTH.md).

## Project structure

```
App.js                  App entry: splash, onboarding, then the student navigator
index.jsx               Registers the root component
app.json                Expo configuration and plugins
.env.example            Settings to copy to .env.local
assets/                 Logo, owl illustrations and app icons
firebase-rules/         Firestore and Storage security rules (locked until Member 1 writes them)
src/
  config/               Firebase connection
  constants/            Roles, collection names, statuses, screen names, campus location
  context/              AuthContext: who is logged in and their role
  services/             All data access, one file per area (screens never call Firebase directly)
  utils/                Helpers, such as distance for geolocation
  navigation/           One navigator per role, and AppNavigator that picks the right one
  screens/              Grouped by who uses them: onboarding, auth, student, tutor, professional, admin, shared
  components/           Reusable UI (buttons, inputs, cards, header, loading/empty/error states)
  theme/                Colors, spacing, typography, responsive helpers, screen styles
  data/                 Mock data and filter categories (to be replaced by Firebase)
docs/
  README.md             Index of all the documents
  ARCHITECTURE.md       How the code is organized and the rules for working in it
  PROJECT_PLAN.md       3-week plan with member areas and task tables
  FIRESTORE_SCHEMA.md   Draft data structure for Firebase
  MOCK_DATA_INVENTORY.md  Where mock data is used and what replaces it
  members/              One task brief per member
.github/                Pull request checklist
```

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) explains every folder in detail.

## Team and plan

Four members each own one area. The plan has three weeks: foundation and core screens (Oct 10 to 18), Firebase features (Oct 19 to 25), and integration, polish and submission (Oct 26 to Nov 1). The areas are:

| Member | Area |
| --- | --- |
| Member 1 | Firebase setup, logins for all roles, security |
| Member 2 | Student features, booking, payment and geolocation |
| Member 3 | Front end and UI customization |
| Member 4 | In-app notifications, chat and admin |

Each member has a brief with their files, tasks and things to watch out for:

- [Member 1: Firebase setup, logins and security](docs/members/MEMBER_1_FIREBASE_AND_AUTH.md)
- [Member 2: Student features, booking, payment and geolocation](docs/members/MEMBER_2_STUDENT_FEATURES.md)
- [Member 3: Front end and UI customization](docs/members/MEMBER_3_FRONT_END_UI.md)
- [Member 4: In-app notifications, chat and admin](docs/members/MEMBER_4_NOTIFICATIONS_CHAT_ADMIN.md)

Read [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for the tasks and [`CONTRIBUTING.md`](CONTRIBUTING.md) for how we work in this repo.

## License

See [`LICENSE`](LICENSE). It is currently the MIT license text from the Expo project template, with Expo's copyright line. Before submission, the team should decide on the license and replace the copyright holder with the team's own.
