import { coordinatesFromLocationCell } from './geolocation.js';

export function splitTutorsByMapLocation(tutors) {
  const locatedTutors = [];
  const tutorsWithoutLocation = [];

  tutors.forEach((tutor) => {
    const coordinates = tutor.locationCellVersion === 1
      ? coordinatesFromLocationCell(tutor.locationCell)
      : null;
    if (coordinates) {
      locatedTutors.push({ ...tutor, mapCoordinates: coordinates });
    } else {
      tutorsWithoutLocation.push(tutor);
    }
  });

  return { locatedTutors, tutorsWithoutLocation };
}

export function getTutorMapRegion(tutors) {
  const coordinates = tutors
    .filter((tutor) => tutor.locationCellVersion === 1)
    .map((tutor) => coordinatesFromLocationCell(tutor.locationCell))
    .filter(Boolean);
  if (!coordinates.length) return null;

  const latitudes = coordinates.map(({ latitude }) => latitude);
  const longitudes = coordinates.map(({ longitude }) => longitude);
  const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(0.025, (Math.max(...latitudes) - Math.min(...latitudes)) * 1.6),
    longitudeDelta: Math.max(0.025, (Math.max(...longitudes) - Math.min(...longitudes)) * 1.6),
  };
}
