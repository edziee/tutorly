# Member 3: Front end and UI customization

You make every screen look like the Figma design, for all four kinds of users. Other members connect the data to your screens, so the names and shapes you agree on early save everyone time.

**Read first:** [README](../../README.md), [ARCHITECTURE](../ARCHITECTURE.md), your section in [PROJECT_PLAN](../PROJECT_PLAN.md), [CONTRIBUTING](../../CONTRIBUTING.md). Design: [TUTORLY prototype](https://www.figma.com/design/BCpvrQFfmymLF1r5WvcjPW/TUTORLY).

## Your files

| File | State | What you do |
| --- | --- | --- |
| `src/theme/` | Started | Colors, spacing and typography to match Figma (the plan includes the fonts) |
| `src/components/` | Started | `AppButton`, `AppInput`, `AppHeader`, `ScreenContainer`, `StudentAvatar`, `TutorCard` exist. Complete them to match Figma |
| `src/components/LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx` | Ready | The three states every data screen needs. Style them to match Figma |
| `src/components/NotificationCard.jsx` | Ready | One row for the notifications list. Style it |
| `src/components/ScreenHeader.jsx`, `SessionCard.jsx` | Empty files | Fill them in (`SessionCard` can be moved out of `ScheduleScreen`) or delete them |
| `src/screens/auth/` | Placeholders | `LoginScreen`, `SignUpScreen`, `AdminLoginScreen` |
| `src/screens/student/` | 3 built, 5 placeholders | Built: Tutors, Schedule, StudentProfile. Placeholders: `StudentDashboardScreen`, `BookingScreen`, `PaymentScreen`, `TutorsMapScreen`, `CheckInScreen` |
| `src/screens/professional/ProfessionalDashboardScreen.jsx` | Placeholder | |
| `src/screens/admin/` | Placeholders | `AdminDashboardScreen`, `AdminUsersScreen`, `AdminVerificationsScreen`, `AdminBookingsScreen` |
| `src/screens/shared/NotificationsScreen.jsx` | Placeholder | Opened from the bell in the header. The bell in `AppHeader` still shows a placeholder alert |
| `src/navigation/` | Ready | `StudentNavigator` (built), `AuthNavigator`, `TutorNavigator`, `ProfessionalNavigator`, `AdminNavigator`, `AppNavigator`. Add the screens you build here |
| `src/constants/routes.js` | Ready | Screen names. Add a name here before you register a new screen |

Each placeholder screen has a comment at the top that says who builds the layout, who connects the data, and which plan task it belongs to.

## Tasks by week

Statuses live in [PROJECT_PLAN](../PROJECT_PLAN.md). Change them in the same pull request as your code.

**Week 1**
- Shared theme and components to match Figma.
- Build login and sign-up, the student dashboard and the tutors list. Member 1 connects the login logic through `authService`, so call `signIn` and `signUp` from your screens and leave the Firebase part to them.
- **Design in Figma** the four screens that do not exist yet: professional tutor login, hidden admin login, professional tutor dashboard, admin dashboard. The other members need them in Week 2.
- Agree on screen names and data fields with the feature owners. The fields are in [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md).

**Week 2**
- Build booking, schedule, payment and chat screens, the tutors map and check-in screens, the notification bell and toast, the professional tutor login and dashboard, and the hidden admin login and admin dashboard.
- Loading, empty and error states on every screen that loads data.

**Week 3**
- Polish: spacing, animations, responsive layout, consistency across all four roles. Compare the app with Figma and fix differences.

## How to work with the other members

- **Never block on data.** Build the screen to receive its data as props or from the service function. The function exists already as a placeholder, so the call you write today is the one that works later. Do not add new mock data (see [CONTRIBUTING](../../CONTRIBUTING.md)); until the real function works, use a state variable with an empty list and show `EmptyState`.
- **Tell the feature owner** when you change a screen's layout, because they may be wiring its data.
- **You own `src/theme` and `src/components`**: changes there affect everyone, so announce them and ask for a second review.
- **Admin login:** it is registered in `AuthNavigator` but must not be linked from the normal login. Agree with Member 1 how the team reaches it (for example a long press on the logo).
- **Adding a screen:** create the file in the role's folder, register it in that role's navigator, and add its name to `routes.js`. The student screens that open on top of the tabs (booking, payment, map, check-in) need a stack around the tabs in `StudentNavigator`. That change is yours, and it must keep the existing tabs working.

## Watch out for

- Take colors, spacing and type sizes from `src/theme`. Do not type values into screens.
- Expo SDK 57 changed from older versions. Check the [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) before using an Expo or React Native API from an older tutorial.
- Test on both Android and iOS where you can, and note in the pull request what only works in a development build.

## Done when

Every screen for all four user types looks like the Figma design and uses the shared components, and the other members can connect their data without changing your layout.
