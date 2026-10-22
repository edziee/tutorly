# Member 1: Firebase setup, logins for all roles and security

You make the database and the logins work. Members 2, 3 and 4 cannot use real data until your Week 1 work is done, so start there.

**Read first:** [README](../../README.md), [ARCHITECTURE](../ARCHITECTURE.md), [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md), your section in [PROJECT_PLAN](../PROJECT_PLAN.md), [CONTRIBUTING](../../CONTRIBUTING.md).

## Your files

| File | State | What you do |
| --- | --- | --- |
| `src/config/firebase.js` | Ready | Connects the app to Firebase from `.env.local`. You should not need to edit it |
| `.env.example` | Ready | Copy to `.env.local` and fill in |
| `src/services/authService.js` | Implemented | `signUp`, `signIn`, `signInAdmin`, `signOut`, `subscribeToAuthState` |
| `src/services/userService.js` | Implemented | `getUserProfile`, `createUserProfile`, `updateUserProfile` |
| `src/services/storageService.js` | Reserved, unused | Do not implement Firebase Storage uploads on Spark; tutor proof uses Google Drive URLs and photos use approved external URLs or initials |
| `src/services/tutorService.js` | Partly implemented | Member 2 owns `getTutors`, `getTutorById`; Member 1 owns `getTutorApplication`, `saveTutorApplication` |
| `src/context/AuthContext.jsx` | Implemented | Loads Firebase user profiles, handles sign-out, and persists profile updates |
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
| Tutor transcript or verification proof | Peer tutors list courses and provide a qualifying grade, proof description and Drive URL for each course. Alumni/Professors list courses, may omit grades, and provide one application-level proof description and Drive URL. Store only URLs and metadata in Firestore. The tutor must grant the assigned reviewer access, and the admin must open the link before review. Never store a device-local `file://` URI because admins and other devices cannot open it. |
| Profile photo | Store an instructor-approved external image URL in `photoUrl`. If no URL is available, use the user's initials/avatar placeholder. Do not add a Firebase Storage upload path. |
| Booking, message and verification alerts | Write an in-app notification document from the client service immediately after the related Firestore write succeeds. Do not create a Cloud Function, scheduled function or Firebase Extension. |
| Session reminders | Keep using local `expo-notifications` scheduling on the user's device. This is separate from Firebase and does not require a paid plan. |

Google Drive is external to Firebase. Do not add Google Drive credentials, OAuth tokens, or private API keys to `EXPO_PUBLIC_*` variables. Prefer sharing a proof file with the assigned reviewer's Google account rather than making it public to anyone with the link; confirm the team's sharing policy and reviewer account first. A tutor must confirm that the reviewer can open the submitted URL, and the admin must check it before approving the application. If the link is missing or inaccessible, leave the application pending and request a usable link rather than enabling Blaze or treating the proof as verified.

**Important limitation:** client-created notifications are not guaranteed if the app is closed or offline. The booking/message write is the source of truth; notification creation is best effort and must show an error state without rolling back the main action. Security rules must still restrict notification documents to authenticated users and the allowed schema. Do not describe these client-created alerts as trusted server events.

Sources: [Firebase pricing](https://firebase.google.com/pricing), [Cloud Storage billing changes FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [Cloud Functions pricing](https://firebase.google.com/pricing).

## Step by step: Week 1 setup

1. Pull `main`, then `git checkout -b member1/firebase-setup` and run `npm install`.
2. In the [Firebase console](https://console.firebase.google.com), create a project.
3. Add an app, choose **Web** (`</>`), and copy the config values it shows.
4. **Build > Authentication > Get started > Sign-in method**: turn on **Email/Password**.
5. **Build > Firestore Database > Create database**. Do not leave the database in test mode or use it for real user data: test mode allows anyone to read and write until the configured expiry date. Use disposable test data until the reviewed rules in `firebase-rules/firestore.rules` are published.
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
- Student profile fields and tutor applications save to and load from Firestore. Tutor proof is a Google Drive URL and metadata; profile photos use an external HTTPS URL or initials.
- Verification: `saveTutorApplication` sets `verificationStatus` to `pending` and saves proof metadata using the evidence rules for the tutor type. Peer tutors need a qualifying 1.00–1.50 grade and course-level proof per course; Alumni/Professors need one application-level proof description and Drive URL, while grades are optional. There is no file upload.
- Connect `ProfessionalDashboardScreen` to Firestore once Member 3 has built it.

**Week 3**
- Security rules for Firestore. Each role only reaches its own data, only admins reach admin data, users cannot change their own `role`, and unimplemented chat/notification collections remain closed. Review `firebase-rules/firestore.rules`, test it in the Rules Playground or Emulator Suite, then publish. Before publishing, sign in as admin and use **Migrate approved tutors** on the verification screen so approved legacy profiles remain visible without exposing their proof fields.
- Run the final mock-data sweep for the whole team (checklist at the end of [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md)).

## Mock data you remove

`src/data/mockStudentProfile.jsx` and `src/data/mockMentorApplication.jsx` have been removed from the profile screens. Student details and tutor application data now load from Firestore. Do not replace external photo URLs with Firebase Storage uploads.

The shared tutor dashboard profile summary also reads the tutor application from Firestore for Peer Tutors, Alumni and Professors, including category, credentials, courses, proof details, verification status and application availability. Its booking-request and session panels still contain mock data; booking/schedule data integration belongs to Member 2, and chat integration belongs to Member 4. Do not mark the broader dashboard task complete until those respective owners connect their data and the remaining Member 1-owned professional dashboard work is verified.

## Watch out for

- Write environment variables in full, `process.env.EXPO_PUBLIC_FIREBASE_API_KEY`. Expo does not replace them if you destructure `process.env` or build the name from text.
- The Firebase JS SDK (what we use) runs in Expo Go. Firebase's other library, React Native Firebase, does not, so do not install it.
- Hiding the admin login is not security. `signInAdmin` must check the role, and the Week 3 rules must block admin data for everyone else.
- Ask the team before renaming a collection or field, because other members already code against it.

## Done when

All four roles can log in and land on the right dashboard, profiles and the professional dashboard use Firestore data, no mock data is left in those screens, and the security rules are published.
