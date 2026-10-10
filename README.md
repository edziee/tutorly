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

Last checked against the repo on Oct 10, 2026. The repo is at its first stage: the interface exists, but everything still runs on mock data.

| Area | State |
| --- | --- |
| Splash screen and two-page onboarding | Built (the onboarding is marked to be edited later) |
| Student app with five tabs: Tutors, Profile, Schedule, Tutor Profile, Messages | Built with mock data |
| Tutors list with search and course and tier filters | Built with mock data |
| Schedule with upcoming and past sessions, reschedule, add to calendar | Built with mock data, saved on the device only |
| Messages screen | Built with mock data |
| Tutor application (grades, courses, proof upload) | Built, the proof upload picks a file but keeps it only in the screen's state, nothing is stored |
| Shared theme and reusable components | Started in `src/theme` and `src/components` |
| Login and sign-up (student, tutor, professional tutor, admin) | Not built |
| Professional tutor dashboard and admin dashboard | Not built, not yet designed in Figma |
| Booking flow and payment | Not built |
| Firebase | Not installed yet |
| In-app notifications | Not wired up. The bell in the header shows a placeholder alert; `NotificationCard` and its mock data are not used by any screen |
| Geolocation and map | Not built |

The full list of mock data is in [`docs/MOCK_DATA_INVENTORY.md`](docs/MOCK_DATA_INVENTORY.md).

## Tech stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57 with React Native 0.86 and React 19
- React Navigation (bottom tabs and native stack)
- Expo modules in use: `expo-calendar`, `expo-document-picker`, `expo-image-picker`, `expo-notifications`, `expo-font`
- `@react-native-async-storage/async-storage` for data kept on the device
- Planned: Firebase (Authentication, Firestore, Storage), a map library and Expo location for geolocation

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

Known limits when running:

- Session reminders use `expo-notifications` and are turned off in Expo Go and on the web (the code skips them there). Test them in a development build.
- `expo-calendar` and the image and document pickers need a real device or an emulator with those apps.

### Firebase configuration (when Firebase is added)

Do not commit Firebase keys or any secret. Copy `.env.example` to `.env.local` and fill in the values from the Firebase console. Files named `.env*.local` are already ignored by git. Expo loads variables that start with `EXPO_PUBLIC_` automatically, and they are readable in the built app, so keep real secrets (such as admin credentials) out of them. Access to data is protected by Firestore and Storage security rules, not by hiding the config.

## Project structure

```
App.js                  App entry: splash, onboarding, then the student navigator
index.jsx               Registers the root component
app.json                Expo configuration and plugins
assets/                 Logo, owl illustrations and app icons
src/
  components/           Reusable UI (buttons, inputs, cards, header, onboarding, splash)
  navigation/           StudentNavigator (bottom tabs); AppNavigator is an empty file for now
  screens/              Tutors, Schedule, Chat, Student Profile, Tutor Profile
  theme/                Colors, spacing, typography, responsive helpers, screen styles
  data/                 Mock data and filter categories (to be replaced by Firebase)
docs/
  PROJECT_PLAN.md      3-week plan with member areas and task tables
  MOCK_DATA_INVENTORY.md  Where mock data is used and what replaces it
```

## Team and plan

Four members each own one area. The plan has three weeks: foundation and core screens (Oct 10 to 18), Firebase features (Oct 19 to 25), and integration, polish and submission (Oct 26 to Nov 1). The areas are:

| Member | Area |
| --- | --- |
| Member 1 | Firebase setup, logins for all roles, security |
| Member 2 | Student features, booking, payment and geolocation |
| Member 3 | Front end and UI customization |
| Member 4 | In-app notifications, chat and admin |

Read [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for the tasks and [`CONTRIBUTING.md`](CONTRIBUTING.md) for how we work in this repo.

## License

See [`LICENSE`](LICENSE). It is currently the MIT license text from the Expo project template, with Expo's copyright line. Before submission, the team should decide on the license and replace the copyright holder with the team's own.
