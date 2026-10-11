// Distance helpers for geolocation (Member 2, Week 3).
// A point is an object like { latitude: 14.6507, longitude: 121.0495 }, the
// same shape expo-location returns in position.coords.

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const isPoint = (point) =>
  point != null &&
  Number.isFinite(point.latitude) &&
  Number.isFinite(point.longitude);

// Straight-line distance between two points in kilometers (haversine formula).
// Returns null if either point is missing or has no valid coordinates, so the
// caller can handle tutors that have no saved location.
export function distanceInKm(from, to) {
  if (!isPoint(from) || !isPoint(to)) return null;

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function distanceInMeters(from, to) {
  const km = distanceInKm(from, to);
  return km === null ? null : km * 1000;
}

// True when `point` is within `radiusMeters` of `center`. False if a point is
// missing, so check-in is never allowed without a real location.
export function isWithinRadius(point, center, radiusMeters) {
  const meters = distanceInMeters(point, center);
  return meters !== null && meters <= radiusMeters;
}

// Returns a new list, nearest first, with a `distanceKm` field on each item.
// Items without valid coordinates go to the end with distanceKm = null.
// `getCoordinates` tells the function where an item keeps its location.
export function sortByDistance(items, origin, getCoordinates = (item) => item.coordinates) {
  return items
    .map((item) => ({ ...item, distanceKm: distanceInKm(origin, getCoordinates(item)) }))
    .sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
