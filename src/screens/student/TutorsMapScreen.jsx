// Tutors on a map, the "map view" next to the tutors list.
// Layout: Member 3.   Data and location: Member 2 (Week 3).
// Plan tasks: "Build the tutors map view and session check-in screens"
// (Member 3, Week 2) and "Geolocation: location permission, tutors on the map
// from Firestore location data, nearby-tutor sorting by distance" (Member 2,
// Week 3).
//
// Decision needed before Week 3: expo-maps (the map package in Expo SDK 57) is
// in alpha, does not run in Expo Go, and on Android needs a Google Maps API
// key and a development build. See "Map library" in
// docs/members/MEMBER_2_STUDENT_FEATURES.md. Nothing is installed yet.
import PlaceholderScreen from '../shared/PlaceholderScreen';

export default function TutorsMapScreen() {
  return <PlaceholderScreen title="Tutors map" />;
}
