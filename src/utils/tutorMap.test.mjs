import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getTutorMapRegion, splitTutorsByMapLocation } from './tutorMap.js';

const tutorsScreen = await readFile(
  new URL('../screens/student/TutorsScreen.jsx', import.meta.url),
  'utf8',
);
const tutorService = await readFile(
  new URL('../services/tutorService.js', import.meta.url),
  'utf8',
);
const nativeMapScreen = await readFile(
  new URL('../screens/student/TutorsMapScreen.native.jsx', import.meta.url),
  'utf8',
);
const webMapScreen = await readFile(
  new URL('../screens/student/TutorsMapScreen.web.jsx', import.meta.url),
  'utf8',
);

test('map data uses only coarse public cells and keeps tutors without a cell visible', () => {
  const tutors = [
    {
      id: 'located',
      locationCell: { latitudeCell: 1465, longitudeCell: 12105 },
      locationCellVersion: 1,
      coordinates: { latitude: 40, longitude: -73 },
    },
    {
      id: 'no-location',
      coordinates: { latitude: 14.65, longitude: 121.05 },
    },
    {
      id: 'invalid-cell',
      locationCell: { latitudeCell: 146501, longitudeCell: 12105 },
      locationCellVersion: 1,
    },
  ];

  const { locatedTutors, tutorsWithoutLocation } = splitTutorsByMapLocation(tutors);

  assert.deepEqual(locatedTutors.map(({ id, mapCoordinates }) => ({ id, mapCoordinates })), [
    {
      id: 'located',
      mapCoordinates: { latitude: 14.65, longitude: 121.05 },
    },
  ]);
  assert.deepEqual(tutorsWithoutLocation.map(({ id }) => id), ['no-location', 'invalid-cell']);
  assert.deepEqual(
    splitTutorsByMapLocation([
      { id: 'legacy-address-cell', locationCell: { latitudeCell: 1465, longitudeCell: 12105 } },
    ]).tutorsWithoutLocation.map(({ id }) => id),
    ['legacy-address-cell'],
  );
  assert.match(nativeMapScreen, /Location not available yet/);
  assert.match(nativeMapScreen, /nearMeActive && !locatedTutors\.length/);
  assert.match(nativeMapScreen, /cannot be checked against this distance limit/);
  assert.match(nativeMapScreen, /tutorsWithoutLocation\.map/);
  assert.match(webMapScreen, /Location not available yet/);
  assert.match(webMapScreen, /nearMeActive && !locatedTutors\.length/);
  assert.match(webMapScreen, /cannot be checked against this distance limit/);
  assert.match(webMapScreen, /tutorsWithoutLocation\.map/);
});

test('map pins use coarse tutor cells; search origin is rounded and only used for recentering', () => {
  const region = getTutorMapRegion([
    { locationCell: { latitudeCell: 1465, longitudeCell: 12105 }, locationCellVersion: 1 },
    { locationCell: { latitudeCell: 1475, longitudeCell: 12115 }, locationCellVersion: 1 },
  ]);
  assert.equal(region.latitude, 14.7);
  assert.equal(region.longitude, 121.1);
  assert.ok(Math.abs(region.latitudeDelta - 0.16) < 1e-9);
  assert.ok(Math.abs(region.longitudeDelta - 0.16) < 1e-9);
  assert.equal(getTutorMapRegion([{ id: 'no-location' }]), null);
  assert.match(tutorsScreen, /coordinatesFromLocationCell\(toLocationCell\(nearMeOrigin\)\)/);
  assert.match(tutorsScreen, /approximate location is sent to the map provider/);
  assert.match(tutorsScreen, /Share approximate map location\?/);
  assert.match(tutorsScreen, /Your exact device coordinates are not sent or saved/);
  assert.match(nativeMapScreen, /Center map on \$\{searchOriginLabel\}/);
  assert.match(nativeMapScreen, /shownSearchOriginKey === searchOriginKey/);
  assert.match(nativeMapScreen, /recenterOnSearchOrigin/);
  assert.match(webMapScreen, /Center map on \$\{searchOriginLabel\}/);
  assert.match(webMapScreen, /shownSearchOriginKey === searchOriginKey/);
  assert.match(webMapScreen, /recenterRequest > previousRecenterRequest\.current && searchOrigin/);
  assert.doesNotMatch(nativeMapScreen, /coordinate=\{searchOrigin\}/);
  assert.doesNotMatch(webMapScreen, /position=\{\[searchOrigin\.latitude/);
});

test('Near me is exposed only in map mode and clears its search when returning to list', () => {
  assert.match(
    tutorsScreen,
    /viewMode === 'map' \? \(\s*<Pressable[\s\S]*?onPress={handleNearMePress}/,
  );
  assert.match(
    tutorsScreen,
    /if \(nextView === 'list'\) \{\s+setNearMeActive\(false\);[\s\S]*?setNearMeOrigin\(null\);/,
  );
  assert.match(tutorsScreen, /const MAX_NEARBY_DISTANCE_KM = 10/);
  assert.match(tutorsScreen, /sortByDistanceWithinRadius/);
  assert.match(tutorsScreen, /nearMeActive=\{nearMeActive && Boolean\(nearMeOrigin\)\}/);
});

test('both discovery views use approved public tutors regardless of location-cell availability', () => {
  assert.match(tutorsScreen, /<TutorsMapScreen\s+tutors={displayedTutors}/);
  assert.match(tutorsScreen, /<FlatList\s+data={displayedTutors}/);
  assert.match(tutorService, /where\('verificationStatus', '==', 'approved'\)/);
  assert.doesNotMatch(tutorService, /where\('locationCell'/);
});

test('web uses Leaflet instead of importing native map codegen modules', () => {
  assert.match(webMapScreen, /import \{\s*MapContainer,[\s\S]*?\} from 'react-leaflet'/);
  assert.doesNotMatch(webMapScreen, /from 'react-native-maps'/);
  assert.match(nativeMapScreen, /from 'react-native-maps'/);
});
