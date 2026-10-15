# How the Tutorly code is organized

Read this once before you start. It explains where each kind of file lives, the one rule that keeps four people from breaking each other's work, and how the login switch-over works.

## The one rule

**Screens never talk to Firebase directly.** A screen calls a function from `src/services/`, and only the service files (and `src/config/firebase.js`) import from `firebase/...`.

```
Screen (src/screens)  ->  Service (src/services)  ->  Firebase (src/config/firebase.js)
Member 3 builds layout    feature owner writes data     one shared connection
```

Why: Member 3 can build a screen against a function name like `bookingService.createBooking` while Member 2 is still writing it, and when the data changes (mock data to Firestore) the screen does not change.

Every service function that is not written yet is a placeholder that throws `"... is not implemented yet (owner: Member X)"`. The function names, inputs and outputs are already written in the comments, so that is your contract. When you implement a function, keep its name and inputs. If you must change them, tell whoever builds the screen that calls it.

## Folder map

```
App.js                         App entry: splash, onboarding, then the student navigator
index.jsx                      Registers the root component
app.json                       Expo configuration and plugins
.env.example                   Names of the settings you copy to .env.local (never commit .env.local)
firebase-rules/                Firestore security rules (locked by default, Member 1 writes them)
docs/                          Plan, schema, mock data list, this file, one brief per member
.github/                       Pull request checklist

src/
  config/
    firebase.js                Connects to Firebase. Exports auth, db, requireFirebase()
  constants/
    roles.js                   ROLES: student, tutor, legacy professional, admin
    collections.js             COLLECTIONS: Firestore collection names
    statuses.js                TUTOR_TIERS, BOOKING_STATUS, VERIFICATION_STATUS, NOTIFICATION_TYPES
    routes.js                  ROUTES: the screen names used in navigation.navigate(...)
    campus.js                  CAMPUS: campus location for check-in, read from .env.local
  context/
    AuthContext.jsx            useAuth(): who is logged in and their role
  services/                    All data access. One file per area (see the table below)
  hooks/
    useAsync.js                Load data once from a service: { status, data, error, retry }
    useSubscription.js         Listen to live data from a subscribeTo... service, stops on close
  utils/
    distance.js                Distance in km or meters, "within radius", sort by distance (tested)
    format.js                  timeAgo, formatPeso, formatDateKey (tested)
    validation.js              Email, password and required-field checks for forms (tested)
    errors.js                  Turns a thrown error into a message for the person (tested)
    bookings.js                getNextBooking and time helpers (tested)
    user.js                    getUserId and getFirstName for the logged-in profile (tested)
  navigation/
    AppNavigator.jsx           Picks the navigator for the logged-in role
    AuthNavigator.jsx          Login, sign up, hidden admin login
    StudentNavigator.jsx       Student tabs inside a stack, so Notifications and the dashboard open on top
    TutorNavigator.jsx         Tutor screens
    AdminNavigator.jsx         Admin tabs
  screens/
    onboarding/                SplashScreen, OnboardingScreen
    auth/                      LoginScreen, SignUpScreen (built), AdminLoginScreen
    student/                   Tutors, Schedule, StudentProfile, StudentDashboard (built) + booking, payment, map, check-in
    tutor/                     TutorProfileScreen (built)
    admin/                     Dashboard, Users, Verifications, Bookings (all built)
    shared/                    ChatScreen, NotificationsScreen (built), PlaceholderScreen
  components/                  Reusable UI used by many screens: AppButton, AppInput, Card, StatCard, StatusBadge, FilterChips, SegmentedControl, Checkbox, RoleCard, AuthHeader, NotificationBell, and the Loading, Empty and Error states
  theme/                       Colors, spacing, typography, responsive helpers, screen styles
  data/                        Mock data. Temporary: every file here is deleted by the end of Week 3
```

Screens marked "built" are finished. The older ones (tutors, schedule, chat, profiles) still use mock data; the ones built in the `member3/ui-screens` branch read only from services (see [SCREEN_DATA_CONTRACTS.md](SCREEN_DATA_CONTRACTS.md)). The rest are placeholders that show a title and "Coming soon", each with a comment at the top saying who builds the layout, who connects the data, and which plan task it belongs to.

## Services

| File | What it holds | Owner |
| --- | --- | --- |
| `authService.js` | Sign up, login, admin login, logout, listen to login state | Member 1 |
| `userService.js` | Read and write the user document | Member 1 |
| `storageService.js` | Reserved; not used on the Spark plan. Proof and profile images use approved external URLs | Member 1 |
| `tutorService.js` | Tutors list and detail (Member 2); tutor application (Member 1) | Members 2 and 1 |
| `bookingService.js` | Create, list, reschedule, pay for, check in to bookings | Member 2 |
| `locationService.js` | Location permission, current position, "am I at campus" | Member 2 |
| `chatService.js` | Conversations and real-time messages | Member 4 |
| `notificationService.js` | Create, listen to, mark read, preferences | Member 4 |
| `adminService.js` | Users, pending verifications, approve or reject, bookings overview | Member 4 |

## Navigation flow

```
App.js  ->  splash  ->  onboarding  ->  NavigationContainer
                                          -> AppNavigator
                                               not logged in  -> AuthNavigator
                                               student        -> StudentNavigator
                                               tutor          -> TutorNavigator
                                               legacy professional -> TutorNavigator
                                               admin          -> AdminNavigator
```

## Switching on login

Today `App.js` shows `StudentNavigator` directly, because there is no login yet, and `AuthProvider` always says nobody is logged in. If we switched to `AppNavigator` now, the app would show the placeholder login screen and nothing else.

Member 1 does the switch when login works:

1. Finish `AuthProvider` in `src/context/AuthContext.jsx` (the steps are in the comment at the top of that file).
2. In `App.js`, import `AuthProvider` and `AppNavigator`, and replace the `StudentNavigator` line:

```jsx
<NavigationContainer>
  <AuthProvider>
    <AppNavigator />
  </AuthProvider>
</NavigationContainer>
```

3. Replace `mockStudentProfile` in `StudentNavigator.jsx` (the header initials) with the logged-in user from `useAuth()`.

## How to add things

**A new screen:** create the file in the folder for its role, register it in that role's navigator, and add its name to `src/constants/routes.js`. Take colors, spacing and type sizes from `src/theme`.

**A new service function:** add it to the service file of its area, with a short comment on inputs and outputs. If the area has no file, ask Member 1, because new files usually mean new Firestore data.

**A new Firestore field or collection:** ask Member 1 first, then update [`FIRESTORE_SCHEMA.md`](FIRESTORE_SCHEMA.md) in the same pull request. Security rules depend on it.

**Loading, empty and error states:** every screen that loads data uses `LoadingState`, `EmptyState` and `ErrorState` from `src/components`. The hooks in `src/hooks` give a screen the state it needs: `useAsync(() => getUsers(), [])` for one-time loads and `useSubscription((onData) => subscribeToNotifications(id, onData), [id])` for live data. Both turn a thrown error (including a placeholder service that is "not implemented yet") into `status: 'error'`, so the screen shows the error state with a "Try again" button instead of crashing.

## Placeholders still in the repo

- `src/components/ScreenHeader.jsx` and `src/components/SessionCard.jsx` are empty files. `SessionCard` is meant to be pulled out of `ScheduleScreen`, which currently defines its own copy inside the screen. Member 3 either fills them in or deletes them.
- `src/theme/scheduleScreenStyles.jsx` and `src/theme/tutorProfileScreenStyles.jsx` are styles for single screens, kept in `theme` for now. Member 3 decides whether to move them next to their screens.
- `package.json` says `"main": "node_modules/expo/AppEntry.js"`, which loads `App.js` itself, so `index.jsx` is not used at the moment. Leave it unless Member 3 wants to change the entry.

## Not decided yet

- **Map library:** see "Map library" in [`members/MEMBER_2_STUDENT_FEATURES.md`](members/MEMBER_2_STUDENT_FEATURES.md).
- **Files and images:** Firebase Storage is intentionally disabled on the Spark plan. Store only approved external URLs and metadata; see [`members/MEMBER_1_FIREBASE_AND_AUTH.md`](members/MEMBER_1_FIREBASE_AND_AUTH.md).
- **Notifications:** client services write in-app notification documents after the related Firestore write. Do not add Cloud Functions or scheduled Firebase jobs; client-created notifications are best effort, not a trusted audit log.
