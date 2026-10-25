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
- Near me and map discovery: request foreground permission, use the device position or the student’s saved private address as a fallback, and sort approved tutors by approximate distance using coarse public location cells. Never read other users’ private profile documents or publish exact tutor coordinates or addresses. Tutors without safe location cells remain visible in the list and map's location-unavailable section, without pins or distances. Campus Check-In remains separate.
- Check-in: allow it only when `isAtCampus` is true, then call `checkInToBooking`. Set the real campus in `.env.local` (`EXPO_PUBLIC_CAMPUS_LATITUDE`, `EXPO_PUBLIC_CAMPUS_LONGITUDE`, `EXPO_PUBLIC_CAMPUS_RADIUS_METERS`).
- If you finish early in Week 2, start the map setup then. Week 3 is short.

## Map library

Tutor discovery uses `react-native-maps` on iOS/Android, which is included in Expo Go for SDK 58. The web build uses Leaflet with OpenStreetMap tiles because `react-native-maps` does not support Expo Web. Standalone Android app binaries need a Google Maps API key and a rebuilt native binary. Set `GOOGLE_MAPS_API_KEY` in the local/build environment; `app.config.js` passes it to the map config plugin. Do not commit the key. Expo Go does not require this key.

The list and map share the same tutor search and filters. Near me is available only in map mode. It filters mapped tutors to within approximately 10 km, ordered nearest first, using straight-line distance from the student’s search origin to the coarse `locationCell` derived from each approved tutor’s saved city/area. This is an estimate, not driving distance. Tutors without a usable location remain visible in a clearly labeled section. Tutor home addresses are never used for public pins or distances. Student device coordinates are used in memory; if the student taps the recenter control, only a rounded approximate map location is sent to the map provider to load tiles, after the location-use disclosure is accepted. Admin Verifications → **Update approved tutor records** backfills existing approved tutors from their private saved city/area. Legacy cells without the city-area marker are ignored until that migration runs.

Docs: [react-native-maps](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), [expo-location](https://docs.expo.dev/versions/v58.0.0/sdk/location/).

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
