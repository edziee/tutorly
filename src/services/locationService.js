// Geolocation: permission, the phone's current position, and the campus check.
// Owner: Member 2 (Week 3).
//
// Uses expo-location, which is already installed. Docs for the exact SDK:
// https://docs.expo.dev/versions/v57.0.0/sdk/location/
//   import * as Location from 'expo-location';
//   Location.requestForegroundPermissionsAsync()
//   Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
// Foreground location works in Expo Go. Background location does not, and the
// plan does not need it.
//
// The distance math is already done and tested in src/utils/distance.js, and
// the campus location comes from src/constants/campus.js.
import { notImplemented } from './notImplemented';

/**
 * Ask the user for permission to use their location while the app is open.
 * @returns {Promise<boolean>} true if granted
 */
export async function requestLocationPermission() {
  throw notImplemented('locationService.requestLocationPermission', 'Member 2');
}

/**
 * @returns {Promise<{ latitude: number, longitude: number } | null>} null if
 * permission was denied or the position could not be read
 */
export async function getCurrentCoordinates() {
  throw notImplemented('locationService.getCurrentCoordinates', 'Member 2');
}

/**
 * True only if the phone is within CAMPUS.radiusMeters of the campus. Use
 * isWithinRadius from src/utils/distance.js.
 * @param {{ latitude: number, longitude: number } | null} coordinates
 * @returns {boolean}
 */
export function isAtCampus(coordinates) {
  throw notImplemented('locationService.isAtCampus', 'Member 2');
}
