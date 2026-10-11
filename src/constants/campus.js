// Campus location used by the session check-in (Member 2, Week 3).
// The values come from .env.local so the team can set the real campus without
// changing code. They are map coordinates, not secrets.
//
// Read each variable with dot notation exactly as written below. Expo only
// replaces process.env.EXPO_PUBLIC_NAME written out in full, so do not
// destructure process.env or build the name from a string.
const latitude = Number.parseFloat(process.env.EXPO_PUBLIC_CAMPUS_LATITUDE);
const longitude = Number.parseFloat(process.env.EXPO_PUBLIC_CAMPUS_LONGITUDE);
const radiusMeters = Number.parseFloat(process.env.EXPO_PUBLIC_CAMPUS_RADIUS_METERS);

export const CAMPUS = {
  latitude,
  longitude,
  // How close (in meters) a student must be to check in. Falls back to 200 m.
  radiusMeters: Number.isFinite(radiusMeters) ? radiusMeters : 200,
};

// False until the campus coordinates are filled in .env.local.
export const isCampusConfigured =
  Number.isFinite(latitude) && Number.isFinite(longitude);
