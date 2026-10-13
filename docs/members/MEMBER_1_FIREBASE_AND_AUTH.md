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
| `src/services/storageService.js` | Reserved | Do not implement Firebase Storage uploads on Spark; store approved external proof/photo URLs instead |
| `src/services/tutorService.js` | Placeholders | Yours: `getTutorApplication`, `saveTutorApplication` |
| `src/context/AuthContext.jsx` | Starter | Finish `AuthProvider` (steps in the comment at the top) |
| `src/navigation/AppNavigator.jsx` | Ready | Chooses the screens for the role. You switch `App.js` to it |
| `src/screens/auth/*` | Placeholders | Member 3 builds the layout, you connect `Login`, `SignUp` and `AdminLogin` |
| `src/screens/professional/ProfessionalDashboardScreen.jsx` | Placeholder | Member 3 builds it, you connect it to Firestore in Week 2 |
| `src/constants/roles.js`, `collections.js` | Ready | Roles and collection names. Change them only together with the schema |
| `firebase-rules/` | Locked | Where you write the security rules in Week 3 |
| `docs/FIRESTORE_SCHEMA.md` | Draft | Confirm or change it, then keep it up to date |

## Spark-plan rule: do not use Firebase Storage or Cloud Functions

The team is staying on Firebase's free Spark plan. **Cloud Storage for Firebase requires the pay-as-you-go Blaze plan**, so the app must not call `firebase/storage`, upload files, or depend on Storage security rules. **Cloud Functions and other server-side Firebase features that require billing are also out of scope.** Authentication and Firestore remain the Firebase services used by the app.

The required features still work with these Spark-compatible replacements:

| Feature | Spark-compatible approach |
| --- | --- |
| Tutor transcript or verification proof | Let the tutor enter the course, grade and document title, then provide a reviewable URL from an instructor-approved free file host. Store only the URL and metadata in the tutor document. Never store a device-local `file://` URI because admins and other devices cannot open it. |
| Profile photo | Store an instructor-approved external image URL in `photoUrl`. If no URL is available, use the user's initials/avatar placeholder. Do not add a Firebase Storage upload path. |
| Booking, message and verification alerts | Write an in-app notification document from the client service immediately after the related Firestore write succeeds. Do not create a Cloud Function, scheduled function or Firebase Extension. |
| Session reminders | Keep using local `expo-notifications` scheduling on the user's device. This is separate from Firebase and does not require a paid plan. |

The external file host is not part of Firebase. Do not add credentials or private API keys for it to `EXPO_PUBLIC_*` variables. A tutor must confirm that the submitted URL is accessible to the assigned admin before the application can be reviewed. If the instructor does not approve an external host, keep the proof as structured text and mark the file attachment as unavailable rather than enabling Blaze.

**Important limitation:** client-created notifications are not guaranteed if the app is closed or offline. The booking/message write is the source of truth; notification creation is best effort and must show an error state without rolling back the main action. Security rules must still restrict notification documents to authenticated users and the allowed schema. Do not describe these client-created alerts as trusted server events.

Sources: [Firebase pricing](https://firebase.google.com/pricing), [Cloud Storage billing changes FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [Cloud Functions pricing](https://firebase.google.com/pricing).

## Step by step: Week 1 setup

1. Pull `main`, then `git checkout -b member1/firebase-setup` and run `npm install`.
2. In the [Firebase console](https://console.firebase.google.com), create a project.
3. Add an app, choose **Web** (`</>`), and copy the config values it shows.
4. **Build > Authentication > Get started > Sign-in method**: turn on **Email/Password**.
5. **Build > Firestore Database > Create database**. Start in **test mode** so the team can build. Test mode lets anyone read and write until a date Firebase shows you (usually 30 days), so it must be replaced with real rules in Week 3.
6. Do not enable Storage, add Storage imports, or create a Storage bucket. Use the Spark-compatible proof and photo URL fields described above.
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
- Verification: `saveTutorApplication` sets `verificationStatus` to `pending` and saves structured proof metadata plus the reviewable URL. There is no file upload.
- Connect `ProfessionalDashboardScreen` to Firestore once Member 3 has built it.

**Week 3**
- Security rules for Firestore. Each role only reaches its own data, only admins reach admin data, users cannot change their own `role`, and notification documents follow the allowed schema. Write them in `firebase-rules/firestore.rules`, test them in the console's Rules Playground, then publish.
- Run the final mock-data sweep for the whole team (checklist at the end of [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md)).

## Mock data you remove

`src/data/mockStudentProfile.jsx` (replaced by `users`) and `src/data/mockMentorApplication.jsx` (replaced by the tutor's profile). Delete each file in the same pull request that stops using it, and tick it in `MOCK_DATA_INVENTORY.md`. `StudentNavigator.jsx` also reads `mockStudentProfile` for the header initials. Do not replace these with Firebase Storage uploads.

## Watch out for

- Write environment variables in full, `process.env.EXPO_PUBLIC_FIREBASE_API_KEY`. Expo does not replace them if you destructure `process.env` or build the name from text.
- The Firebase JS SDK (what we use) runs in Expo Go. Firebase's other library, React Native Firebase, does not, so do not install it.
- Hiding the admin login is not security. `signInAdmin` must check the role, and the Week 3 rules must block admin data for everyone else.
- Ask the team before renaming a collection or field, because other members already code against it.

## Done when

All four roles can log in and land on the right dashboard, profiles and the professional dashboard use Firestore data, no mock data is left in those screens, and the security rules are published.
