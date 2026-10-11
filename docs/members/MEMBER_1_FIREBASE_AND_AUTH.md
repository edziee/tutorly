# Member 1: Firebase setup, logins for all roles and security

You make the database and the logins work. Members 2, 3 and 4 cannot use real data until your Week 1 work is done, so start there.

**Read first:** [README](../../README.md), [ARCHITECTURE](../ARCHITECTURE.md), [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md), your section in [PROJECT_PLAN](../PROJECT_PLAN.md), [CONTRIBUTING](../../CONTRIBUTING.md).

## Your files

| File | State | What you do |
| --- | --- | --- |
| `src/config/firebase.js` | Ready | Connects the app to Firebase from `.env.local`. You should not need to edit it |
| `.env.example` | Ready | Copy to `.env.local` and fill in |
| `src/services/authService.js` | Placeholders | `signUp`, `signIn`, `signInAdmin`, `signOut`, `subscribeToAuthState` |
| `src/services/userService.js` | Placeholders | `getUserProfile`, `createUserProfile`, `updateUserProfile` |
| `src/services/storageService.js` | Placeholders | `uploadVerificationDocument`, `uploadProfilePhoto` (see the decision below) |
| `src/services/tutorService.js` | Placeholders | Yours: `getTutorApplication`, `saveTutorApplication` |
| `src/context/AuthContext.jsx` | Starter | Finish `AuthProvider` (steps in the comment at the top) |
| `src/navigation/AppNavigator.jsx` | Ready | Chooses the screens for the role. You switch `App.js` to it |
| `src/screens/auth/*` | Placeholders | Member 3 builds the layout, you connect `Login`, `SignUp` and `AdminLogin` |
| `src/screens/professional/ProfessionalDashboardScreen.jsx` | Placeholder | Member 3 builds it, you connect it to Firestore in Week 2 |
| `src/constants/roles.js`, `collections.js` | Ready | Roles and collection names. Change them only together with the schema |
| `firebase-rules/` | Locked | Where you write the security rules in Week 3 |
| `docs/FIRESTORE_SCHEMA.md` | Draft | Confirm or change it, then keep it up to date |

## Decision: Firebase Storage needs a paid plan

Checked on the official Firebase pages on Oct 11, 2026: **Cloud Storage for Firebase requires the pay-as-you-go Blaze plan.** Authentication and Firestore both work on the free Spark plan. Blaze needs a billing account (a card) linked to the project, but usage inside the free amounts (5 GB stored in `us-central1`, `us-east1` or `us-west1`) costs nothing. Spark projects cannot use Storage at all, and calls fail with an error.

This matters because the plan uploads tutors' verification files (transcripts) to Storage. Decide this in Week 1 and tell everyone:

| Option | What changes |
| --- | --- |
| A. Upgrade to Blaze | Plan stays as is. Choose a US region, and set a budget alert in Google Cloud so you are warned early (an alert only warns, it does not stop charges) |
| B. Stay on Spark and skip file upload | Tutors enter courses, grades and the file name, and the admin reviews those. `storageService.js` and `proofPath` are not used. The "verification documents upload" part of the plan changes, so tell your instructor |

Sources: [Firebase pricing](https://firebase.google.com/pricing), [Cloud Storage billing changes FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

## Step by step: Week 1 setup

1. Pull `main`, then `git checkout -b member1/firebase-setup` and run `npm install`.
2. In the [Firebase console](https://console.firebase.google.com), create a project.
3. Add an app, choose **Web** (`</>`), and copy the config values it shows.
4. **Build > Authentication > Get started > Sign-in method**: turn on **Email/Password**.
5. **Build > Firestore Database > Create database**. Start in **test mode** so the team can build. Test mode lets anyone read and write until a date Firebase shows you (usually 30 days), so it must be replaced with real rules in Week 3.
6. Storage: only after the decision above.
7. Copy `.env.example` to `.env.local` and paste the config values. Restart Expo with `npx expo start -c`, because Expo only reads the variables when it starts.
8. Share the values with the team in your group chat. Never commit `.env.local`. These values are settings and not secrets, but the repo should not carry them.
9. Check the connection: `isFirebaseConfigured` from `src/config/firebase.js` is `true` once the values are filled in.
10. Confirm or change [`FIRESTORE_SCHEMA.md`](../FIRESTORE_SCHEMA.md) and tell the team.
11. Create the first admin by hand: **Authentication > Users > Add user**, then in Firestore add a document `users/{that user's uid}` with `role` set to `admin`. There is no admin sign-up in the app.

## Tasks by week

Statuses live in [PROJECT_PLAN](../PROJECT_PLAN.md). Change them in the same pull request as your code.

**Week 1**
- Firebase project and `.env.local` (steps above), schema confirmed.
- Sign-up and login for students and tutors: `authService.signUp` and `signIn`, plus `userService.createUserProfile`. A new account gets a `users/{uid}` document with its `role`.
- Finish `AuthProvider`, then switch `App.js` to `AppNavigator` ("Switching on login" in [ARCHITECTURE](../ARCHITECTURE.md)) once a student can log in.
- Hand Members 2 to 4 a test account for each role as soon as you have them.
- The mock data list is drafted in [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md). Review it with the team and compile the final version.

**Week 2**
- Professional tutor login and sign-up with verification documents, and the hidden admin login (`signInAdmin` signs the person out and throws if the role is not `admin`).
- Each role opens its own dashboard (this is `AppNavigator`).
- Profiles save to and load from Firestore. `StudentProfileScreen` and `TutorProfileScreen` stop using their mock data.
- Verification: `saveTutorApplication` sets `verificationStatus` to `pending`. The upload part follows the Storage decision.
- Connect `ProfessionalDashboardScreen` to Firestore once Member 3 has built it.

**Week 3**
- Security rules for Firestore (and Storage if used). Each role only reaches its own data, only admins reach admin data, and users cannot change their own `role`. Write them in `firebase-rules/firestore.rules`, test them in the console's Rules Playground, then publish.
- Run the final mock-data sweep for the whole team (checklist at the end of [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md)).

## Mock data you remove

`src/data/mockStudentProfile.jsx` (replaced by `users`) and `src/data/mockMentorApplication.jsx` (replaced by the tutor's profile). Delete each file in the same pull request that stops using it, and tick it in `MOCK_DATA_INVENTORY.md`. `StudentNavigator.jsx` also reads `mockStudentProfile` for the header initials.

## Watch out for

- Write environment variables in full, `process.env.EXPO_PUBLIC_FIREBASE_API_KEY`. Expo does not replace them if you destructure `process.env` or build the name from text.
- The Firebase JS SDK (what we use) runs in Expo Go. Firebase's other library, React Native Firebase, does not, so do not install it.
- Hiding the admin login is not security. `signInAdmin` must check the role, and the Week 3 rules must block admin data for everyone else.
- Ask the team before renaming a collection or field, because other members already code against it.

## Done when

All four roles can log in and land on the right dashboard, profiles and the professional dashboard use Firestore data, no mock data is left in those screens, and the security rules are published.
