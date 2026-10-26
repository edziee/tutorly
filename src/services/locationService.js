// Foreground geolocation for tutor discovery. Student device coordinates are
// used only in memory; geocode caches stay in the owner's private profile.
import * as Location from 'expo-location';
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import {
  geocodeKeyForAddress,
  geocodeKeyForLocationArea,
  getDevicePositionIssue,
  getLocationFallbackReason,
  getLocationFallbackNotice,
  getNearMeProfileError,
  isValidCoordinates,
  toLocationCell,
} from '../utils/geolocation';
import { notImplemented } from './notImplemented';

/**
 * Ask the user for permission to use their location while the app is open.
 * @returns {Promise<boolean>} true if granted
 */
export async function requestLocationPermission() {
  const permission = await Location.requestForegroundPermissionsAsync();
  return permission.status === 'granted';
}

async function getCurrentDevicePosition() {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return { reason: 'permission-denied' };
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    return { reason: 'services-disabled' };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const issue = getDevicePositionIssue(position);
  if (issue) return { reason: issue };

  return {
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
  };
}

/**
 * @returns {Promise<{ latitude: number, longitude: number } | null>} null if
 * permission was denied or the position could not be read with sufficient
 * accuracy and freshness
 */
export async function getCurrentCoordinates() {
  const result = await getCurrentDevicePosition();
  return result.coordinates ?? null;
}

async function getSavedAddressCoordinates(uid, city, address) {
  const profileRef = doc(requireFirebase().db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(profileRef);
  if (!snapshot.exists()) throw new Error('Your profile could not be loaded. Retry or sign in again.');

  const profile = snapshot.data();
  const savedCity = typeof profile.location === 'string' ? profile.location.trim() : '';
  const savedAddress = typeof profile.homeAddress === 'string'
    ? profile.homeAddress.trim()
    : '';
  const profileError = getNearMeProfileError({
    location: savedCity,
    homeAddress: savedAddress,
  });
  if (profileError) throw new Error(profileError);

  const addressKey = geocodeKeyForAddress(savedCity || city, savedAddress || address);
  if (
    profile.homeAddressGeocodeKey === addressKey &&
    isValidCoordinates(profile.homeAddressCoordinates)
  ) {
    return profile.homeAddressCoordinates;
  }

  let geocodedLocations;
  try {
    geocodedLocations = await Location.geocodeAsync(`${savedAddress}, ${savedCity}`);
  } catch {
    throw new Error('We couldn’t geocode your saved address. Check it in your profile and retry.');
  }
  const firstMatch = geocodedLocations[0];
  const coordinates = {
    latitude: firstMatch?.latitude,
    longitude: firstMatch?.longitude,
  };
  if (!isValidCoordinates(coordinates)) {
    throw new Error('We couldn’t find your saved address. Check the address and city in your profile, then retry.');
  }

  await updateDoc(profileRef, {
    homeAddressCoordinates: coordinates,
    homeAddressGeocodeKey: addressKey,
  });
  return coordinates;
}

/**
 * Determine the student search origin. Device coordinates are never written
 * to Firestore; the private address cache is used only when device location is
 * denied or unavailable.
 * @param {object} profile Current signed-in student's profile
 * @returns {Promise<{ coordinates: object, source: string, notice: string }>}
 */
export async function getStudentSearchOrigin(profile) {
  if (profile.geolocationConsent !== true) {
    throw new Error('Agree to the Near me location policy before searching.');
  }

  let permissionState = 'error';
  try {
    permissionState = await requestLocationPermission() ? 'granted' : 'denied';
  } catch {
    permissionState = 'error';
  }

  let servicesEnabled;
  let positionIssue;
  if (permissionState === 'granted') {
    try {
      const result = await getCurrentDevicePosition();
      if (result.coordinates) {
        return { coordinates: result.coordinates, source: 'device', notice: '' };
      }
      positionIssue = result.reason;
      servicesEnabled = result.reason === 'services-disabled' ? false : true;
    } catch {
      positionIssue = 'position-unavailable';
    }
  }
  const fallbackReason = getLocationFallbackReason({
    permissionState,
    servicesEnabled,
    positionIssue,
    positionAvailable: false,
  });

  const uid = profile.uid ?? profile.id;
  if (!uid) throw new Error('Sign in again to use Near me.');
  try {
    const coordinates = await getSavedAddressCoordinates(
      uid,
      profile.location,
      profile.homeAddress,
    );
    return {
      coordinates,
      source: 'saved-address',
      notice: getLocationFallbackNotice(fallbackReason),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'The saved address could not be used.';
    throw new Error(`${getLocationFallbackNotice(fallbackReason)} ${detail}`.trim());
  }
}

/** Save only the student's consent decision; no device coordinates are saved. */
export async function recordGeolocationConsent(uid, consented) {
  if (!uid || typeof consented !== 'boolean') {
    throw new Error('A user id and location-consent decision are required.');
  }
  await updateDoc(doc(requireFirebase().db, COLLECTIONS.USERS, uid), {
    geolocationConsent: consented,
    geolocationConsentAt: serverTimestamp(),
  });
}

async function clearPublicLocationCell(tutorRef, tutorProfile) {
  if (
    tutorProfile &&
    ('locationCell' in tutorProfile || 'locationCellVersion' in tutorProfile)
  ) {
    await updateDoc(tutorRef, {
      locationCell: deleteField(),
      locationCellVersion: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Geocode a tutor's saved city/area and publish only its coarse cell to the
 * existing public tutor document. The private home address is not used.
 */
export async function syncTutorApproximateLocation(uid) {
  const auth = requireAuth();
  if (!uid || auth.currentUser?.uid !== uid) {
    throw new Error('Only the signed-in tutor can update their approximate location.');
  }

  const { db } = requireFirebase();
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const tutorRef = doc(db, COLLECTIONS.TUTORS, uid);
  const [userSnapshot, tutorSnapshot] = await Promise.all([
    getDoc(userRef),
    getDoc(tutorRef),
  ]);
  if (!userSnapshot.exists()) throw new Error('Your private profile could not be loaded.');
  if (!tutorSnapshot.exists()) return { published: false, reason: 'profile' };

  const tutorProfile = tutorSnapshot.data();
  await clearPublicLocationCell(tutorRef, tutorProfile);
  if (!['pending', 'approved'].includes(tutorProfile.verificationStatus)) {
    return { published: false, reason: 'verification' };
  }

  const profile = userSnapshot.data();
  const city = typeof profile.location === 'string' ? profile.location.trim() : '';
  if (!city) {
    await updateDoc(tutorRef, { location: '', updatedAt: serverTimestamp() });
    return { published: false, reason: 'profile' };
  }

  const locationAreaKey = geocodeKeyForLocationArea(city);
  let coordinates = profile.locationAreaCoordinates;
  if (
    profile.locationAreaGeocodeKey !== locationAreaKey ||
    !isValidCoordinates(coordinates)
  ) {
    let matches;
    try {
      matches = await Location.geocodeAsync(city);
    } catch {
      throw new Error('We couldn’t geocode your saved city or area. Check it and retry.');
    }
    const firstMatch = matches[0];
    coordinates = {
      latitude: firstMatch?.latitude,
      longitude: firstMatch?.longitude,
    };
    if (!isValidCoordinates(coordinates)) {
      throw new Error('We couldn’t find your saved city or area. Check it and retry.');
    }
    await updateDoc(userRef, {
      locationAreaCoordinates: coordinates,
      locationAreaGeocodeKey: locationAreaKey,
    });
  }

  const locationCell = toLocationCell(coordinates);
  if (!locationCell) throw new Error('The saved city or area returned invalid coordinates.');
  await updateDoc(tutorRef, {
    location: city,
    locationCell,
    locationCellVersion: 1,
    updatedAt: serverTimestamp(),
  });
  return { published: true };
}

/**
 * True only if the phone is within CAMPUS.radiusMeters of the campus.
 * Campus Check-In remains outside this geolocation feature.
 * @param {{ latitude: number, longitude: number } | null} coordinates
 * @returns {boolean}
 */
export function isAtCampus(coordinates) {
  throw notImplemented('locationService.isAtCampus', 'Member 2');
}
