# Contributing to Tutorly

This is how the four of us work in this repo. The tasks and owners are in [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md).

## Before you code

1. Read your member section in the plan and the tasks in the week tables.
2. Check the [Expo SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) before using an Expo or React Native API. Older tutorials often do not match this version.
3. Run `npm install` after pulling, since packages change as Firebase and the map are added.

## Branches and commits

- Never work directly on `main`. Make one branch per member or per task, for example `member1/firebase-auth` or `member3/theme-components`.
- Commit often with a short message that says what changed, for example `Add student login screen` or `Replace mock tutors with Firestore query`.
- Pull `main` before you start and before you open a pull request, so conflicts stay small.
- Open a pull request into `main` and ask one other member to look at it before merging. Shared files (theme, navigation, `package.json`) always need a second pair of eyes.

## Who edits what

- Member 3 owns the shared UI: `src/theme`, `src/components`, and the layout of the screens. Do not change the layout of a screen without telling Member 3.
- The member who owns a feature connects its screens to Firebase and replaces the mock data in it. Member 3 and the feature owner should agree on screen names and data fields first, so the layout and the data fit.
- Member 1 owns the Firebase setup and security rules. Ask Member 1 before adding or renaming a Firestore collection or field.

## Mock data

- Do not add new mock data or hardcoded sample values.
- When you replace mock data in your area, delete the mock file or value in the same pull request and tick it off in [`docs/MOCK_DATA_INVENTORY.md`](docs/MOCK_DATA_INVENTORY.md).
- Week 3 has a final sweep over the whole repo, so leaving old mock files behind makes more work for everyone.

## Updating the plan

When you start or finish a task, change its status in the week tables in `docs/PROJECT_PLAN.md` in the same pull request as the code. Use `Not started`, `In progress`, `Blocked (who or what)` or `Done`.

## Secrets and Firebase

- Never commit passwords, service account keys, admin credentials or any `.env.local` file. The `.gitignore` already skips `.env*.local`.
- Copy `.env.example` to `.env.local` and fill in the values the team shares. Variables that start with `EXPO_PUBLIC_` are included in the built app and can be read by anyone, so they are configuration, not secrets. Protection comes from Firestore security rules and validation of any external proof or image URLs.
- Admin accounts are created by the team directly in Firebase. There is no public admin sign-up.

## Code style

- Components are `.jsx` files with the component name as the file name, in `src/components` or `src/screens`.
- Take colors, spacing and type sizes from `src/theme` instead of writing values in a screen.
- Show loading, empty and error states on every screen that loads data.
- Keep the app working on both Android and iOS where the feature allows it, and note it in the pull request when something only works on one platform or only in a development build.

## Running the app

See the Getting started section in the [README](README.md).
