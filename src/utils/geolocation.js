const LATITUDE_CELL_SCALE = 100;
const LONGITUDE_CELL_SCALE = 100;

export function getNearMeProfileError(profile) {
  if (typeof profile?.location !== 'string' || !profile.location.trim()) {
    return 'Add your city or area to your profile before using Near me.';
  }
  if (typeof profile?.homeAddress !== 'string' || !profile.homeAddress.trim()) {
    return 'Add your home address to your profile before using Near me.';
  }
  return '';
}

export function geocodeKeyForAddress(city, address) {
  return [city, address]
    .map((value) => (typeof value === 'string' ? value : '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase())
    .join('|');
}

export function geocodeKeyForLocationArea(location) {
  return (typeof location === 'string' ? location : '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function isValidCoordinates(coordinates) {
  return Number.isFinite(coordinates?.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    Number.isFinite(coordinates?.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180;
}

export function toLocationCell(coordinates) {
  if (!isValidCoordinates(coordinates)) return null;
  return {
    latitudeCell: Math.round(coordinates.latitude * LATITUDE_CELL_SCALE),
    longitudeCell: Math.round(coordinates.longitude * LONGITUDE_CELL_SCALE),
  };
}

export function coordinatesFromLocationCell(cell) {
  if (
    !Number.isInteger(cell?.latitudeCell) ||
    cell.latitudeCell < -9000 ||
    cell.latitudeCell > 9000 ||
    !Number.isInteger(cell?.longitudeCell) ||
    cell.longitudeCell < -18000 ||
    cell.longitudeCell > 18000
  ) {
    return null;
  }
  return {
    latitude: cell.latitudeCell / LATITUDE_CELL_SCALE,
    longitude: cell.longitudeCell / LONGITUDE_CELL_SCALE,
  };
}

export function formatApproximateDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return '';
  if (distanceKm < 1) {
    const roundedMeters = Math.round((distanceKm * 1000) / 100) * 100;
    if (roundedMeters >= 1000) return '~1.0 km';
    return `~${roundedMeters} m`;
  }
  return `~${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

export function getLocationFallbackNotice(reason) {
  if (reason === 'permission-denied') {
    return 'Device location permission was denied. Showing approximate distances from your saved address. Allow location while using Tutorly and retry to use your current position.';
  }
  if (reason === 'services-disabled') {
    return 'Device location services are turned off. Showing approximate distances from your saved address. Turn on location services and retry to use your current position.';
  }
  if (reason === 'position-unavailable') {
    return 'Your device location is unavailable right now. Showing approximate distances from your saved address.';
  }
  if (reason === 'permission-error') {
    return 'Tutorly could not check device location permission. Showing approximate distances from your saved address.';
  }
  return '';
}

export function getLocationFallbackReason({
  permissionState,
  servicesEnabled,
  positionAvailable,
}) {
  if (permissionState === 'error') return 'permission-error';
  if (permissionState !== 'granted') return 'permission-denied';
  if (servicesEnabled === false) return 'services-disabled';
  if (!positionAvailable) return 'position-unavailable';
  return '';
}
