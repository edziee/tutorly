# Member 2: Student features, booking, payment and geolocation

You make the student side work with real data: finding a tutor, booking, the schedule, payment, and in Week 3 the location features.

**Read first:** [README](../../README.md), [ARCHITECTURE](../ARCHITECTURE.md), [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md), your section in [PROJECT_PLAN](../PROJECT_PLAN.md), [CONTRIBUTING](../../CONTRIBUTING.md).

## Your files

| File | State | What you do |
| --- | --- | --- |
| `src/screens/student/TutorsScreen.jsx` | Firestore-backed | Search and filter logic uses `tutorService.getTutors` |
| `src/screens/student/ScheduleScreen.jsx` | Firestore-backed | Uses `bookingService.subscribeToStudentBookings`; local-only demo sessions and their cache have been removed |
| `src/services/tutorService.js` | Placeholders | Yours: `getTutors`, `getTutorById` |
| `src/services/bookingService.js` | Placeholders | `createBooking`, `subscribeToStudentBookings`, `subscribeToTutorBookings`, `updateBookingStatus`, `rescheduleBooking`, `markBookingPaid`, `checkInToBooking` |
| `src/services/locationService.js` | Placeholders | `requestLocationPermission`, `getCurrentCoordinates`, `isAtCampus` (Week 3) |
| `src/utils/distance.js` | Ready, tested | `distanceInKm`, `distanceInMeters`, `isWithinRadius`, `sortByDistance`. Use these, do not rewrite the math |
| `src/constants/campus.js` | Ready | Campus location for check-in, from `.env.local` |
| `src/constants/statuses.js` | Ready | `BOOKING_STATUS` and `TUTOR_TIERS` |
| `src/screens/student/StudentDashboardScreen.jsx`, `BookingScreen.jsx`, `PaymentScreen.jsx`, `TutorsMapScreen.jsx`, `CheckInScreen.jsx` | Placeholders | Member 3 builds the layout, you connect the data |
| `expo-location` in `package.json` and `app.json` | Installed | Foreground location works in Expo Go |

## Tasks by week

Statuses live in [PROJECT_PLAN](../PROJECT_PLAN.md). Change them in the same pull request as your code.

**Week 1**
- Tutors list logic with search and filters. The screen filters approved tutor profiles by search text, subject and tier.
- Agree on the booking fields with Member 3 and Member 1 (see `bookings` in [FIRESTORE_SCHEMA](../FIRESTORE_SCHEMA.md)), so the booking screens and your data fit.

**Week 2** (needs Member 1's Firebase setup)
- Booking flow and schedule saved to Firestore. A new booking starts as `requested`. A tutor accepting it makes it `upcoming`.
- Connect the student dashboard and tutors list to Firestore.
- Remove the mock data in your area, see below.

**Week 3**
- Payment: connect the payment screen to bookings. A simulated payment is enough (`markBookingPaid`).
- Geolocation: ask for permission, show tutors on the map from `coordinates` in Firestore, sort tutors by distance (`sortByDistance`).
- Check-in: allow it only when `isAtCampus` is true, then call `checkInToBooking`. Set the real campus in `.env.local` (`EXPO_PUBLIC_CAMPUS_LATITUDE`, `EXPO_PUBLIC_CAMPUS_LONGITUDE`, `EXPO_PUBLIC_CAMPUS_RADIUS_METERS`).
- If you finish early in Week 2, start the map setup then. Week 3 is short.

## Map library

Nothing is installed for the map yet, because it needs a team decision. Checked in the Expo SDK 58 docs on Oct 11, 2026:

- `expo-maps` is the map package for SDK 58. It is marked **alpha** ("will frequently experience breaking changes") and **does not run in Expo Go**. You need a development build.
- It uses Google Maps on Android, which needs a **Google Maps API key** (a Google Cloud project with Maps SDK for Android enabled), and Apple Maps on iOS. The docs do not mention web support.
- Other options exist (the docs list `react-native-maps` only as a third-party library). Whatever the choice, test it in a development build early.

Ask your instructor whether the demo must run in Expo Go. If it must, the map could be a simple list sorted by distance with a "Open in Maps" link, and the nearby sorting still works with `sortByDistance`. Decide before Week 3, and write the choice in `docs/ARCHITECTURE.md`.

Docs: [expo-maps](https://docs.expo.dev/versions/v58.0.0/sdk/maps/), [expo-location](https://docs.expo.dev/versions/v58.0.0/sdk/location/).

## Runtime data sources

| Screen data | Source |
| --- | --- |
| Tutors and booking profiles | `tutors` collection through `tutorService` |
| Student schedule | `bookings` collection through `bookingService` |
| `src/data/courseCategories.jsx`, `tierCategories.jsx` | UI filter options, not user or tutor records |

Do not add mock fallbacks to these runtime screens. See [MOCK_DATA_INVENTORY](../MOCK_DATA_INVENTORY.md) for the cleanup scope and preserved test fixtures.

## Watch out for

- The session reminders in `ScheduleScreen` use `expo-notifications` on the device. They do not run in Expo Go or on the web (the code skips them). They are separate from the in-app notifications Member 4 builds.
- Check-in must check the location on the phone **and** be saved with the booking. Do not trust a "checked in" flag from the screen alone.
- Test with an empty database to see the empty state, and with the phone offline to see the error state.

## Done when

A student can find a tutor, book a session and see it in their schedule from Firestore data, the map or list shows nearby tutors first, and check-in works only at the campus location.
