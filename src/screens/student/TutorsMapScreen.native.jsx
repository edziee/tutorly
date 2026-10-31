import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Camera, Map as MapLibreMap, Marker } from '@maplibre/maplibre-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TutorCard from '../../components/TutorCard';
import StudentAvatar from '../../components/StudentAvatar';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatApproximateDistance } from '../../utils/geolocation';
import { getTutorMapRegion, splitTutorsByMapLocation } from '../../utils/tutorMap';

const FIORD_MAP_STYLE = 'https://tiles.openfreemap.org/styles/fiord';

function MapCanvas({
  cameraRef,
  mapRegion,
  recenterRequest,
  initialZoom,
  locatedTutors,
  selectedTutor,
  onSelectTutor,
  nearMeActive,
  searchOrigin,
  searchOriginSource,
  searchOriginMarkerLabel,
  searchOriginMarkerText,
  onMapReady,
  onZoomChange,
  onCenterTutors,
  canRecenterOnSearchOrigin,
  searchOriginLabel,
  onRecenterOnSearchOrigin,
  expanded,
  onToggleExpanded,
  onCloseExpanded,
}) {
  return (
    <>
      <MapLibreMap
        key={`${mapRegion.latitude.toFixed(4)}:${mapRegion.longitude.toFixed(4)}:${mapRegion.latitudeDelta.toFixed(4)}:${mapRegion.longitudeDelta.toFixed(4)}:${expanded}:${recenterRequest}`}
        mapStyle={FIORD_MAP_STYLE}
        attribution
        onDidFinishLoadingMap={onMapReady}
        style={styles.map}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [mapRegion.longitude, mapRegion.latitude],
            zoom: initialZoom,
          }}
          minZoom={4}
          maxZoom={19}
        />
        {locatedTutors.map((tutor) => {
          const isSelected = tutor.id === selectedTutor?.id;
          return (
            <Marker
              key={tutor.id}
              id={tutor.id}
              lngLat={[tutor.mapCoordinates.longitude, tutor.mapCoordinates.latitude]}
              onPress={() => onSelectTutor(tutor.id)}
            >
              <View
                accessibilityLabel={`${tutor.name || 'Tutor'} approximate map marker`}
                style={[styles.marker, isSelected && styles.markerSelected]}
              >
                <StudentAvatar
                  imageUri={tutor.photoUrl}
                  name={tutor.name || 'Tutor'}
                  size={isSelected ? 42 : 34}
                />
              </View>
            </Marker>
          );
        })}
        {nearMeActive && searchOrigin && searchOriginSource ? (
          <Marker
            id="search-origin"
            lngLat={[searchOrigin.longitude, searchOrigin.latitude]}
          >
            <View
              accessibilityLabel={searchOriginMarkerLabel}
              style={styles.searchOriginMarker}
            >
              <Text style={styles.searchOriginMarkerText}>{searchOriginMarkerText}</Text>
            </View>
          </Marker>
        ) : null}
      </MapLibreMap>
      <View style={styles.mapControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          onPress={() => onZoomChange(1)}
          style={styles.mapControl}
        >
          <Feather name="plus" size={20} color={colors.heading} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          onPress={() => onZoomChange(-1)}
          style={styles.mapControl}
        >
          <Feather name="minus" size={20} color={colors.heading} />
        </Pressable>
        {locatedTutors.length ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Center map on tutors"
            onPress={onCenterTutors}
            style={styles.mapControl}
          >
            <Feather name="crosshair" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
        {canRecenterOnSearchOrigin && searchOrigin ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Center map on ${searchOriginLabel}`}
            accessibilityHint="Moves the map to the approximate origin used for this search."
            onPress={onRecenterOnSearchOrigin}
            style={styles.mapControl}
          >
            <Feather name="navigation" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Close expanded map' : 'Expand map'}
          onPress={expanded ? onCloseExpanded : onToggleExpanded}
          style={styles.mapControl}
        >
          <Feather name={expanded ? 'minimize-2' : 'maximize-2'} size={18} color={colors.primary} />
        </Pressable>
      </View>
    </>
  );
}

export default function TutorsMapScreen({
  tutors,
  nearMeActive = false,
  maximumDistanceKm,
  canRecenterOnSearchOrigin = false,
  searchOrigin,
  searchOriginSource,
  onRequestMapRecenter,
  onTutorPress,
}) {
  const mapCameraRef = useRef(null);
  const expandedMapRef = useRef(null);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [searchOriginCenterRequest, setSearchOriginCenterRequest] = useState(0);
  const { locatedTutors, tutorsWithoutLocation } = useMemo(
    () => splitTutorsByMapLocation(tutors),
    [tutors],
  );
  const region = useMemo(
    () => getTutorMapRegion(locatedTutors),
    [locatedTutors],
  );
  useEffect(() => {
    if (!nearMeActive || !searchOrigin) setSearchOriginCenterRequest(0);
  }, [nearMeActive, searchOrigin]);
  const mapRegion = searchOriginCenterRequest > 0 && nearMeActive && searchOrigin
    ? { ...searchOrigin, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : region;
  const initialZoom = mapRegion
    ? Math.min(19, Math.max(4, Math.round(Math.log2(360 / mapRegion.longitudeDelta))))
    : 13;
  const tutorRegionZoom = region
    ? Math.min(19, Math.max(4, Math.round(Math.log2(360 / region.longitudeDelta))))
    : 13;
  const selectedTutor = locatedTutors.find((tutor) => tutor.id === selectedTutorId)
    ?? locatedTutors[0]
    ?? null;
  const searchOriginLabel = searchOriginSource === 'device'
    ? 'your current location'
    : 'your saved address';
  const searchOriginMarkerLabel = searchOriginSource === 'device'
    ? 'You (approximate location)'
    : 'Saved address (approximate)';
  const searchOriginMarkerText = searchOriginSource === 'device' ? 'You' : 'Address';
  const activeCameraRef = mapExpanded ? expandedMapRef : mapCameraRef;

  const adjustZoom = (amount) => {
    const nextZoom = Math.min(19, Math.max(4, zoom + amount));
    setZoom(nextZoom);
    activeCameraRef.current?.zoomTo(nextZoom, { duration: 200 });
  };

  const recenter = () => {
    if (!region) return;
    setSearchOriginCenterRequest(0);
    setZoom(tutorRegionZoom);
    activeCameraRef.current?.easeTo({
      center: [region.longitude, region.latitude],
      zoom: tutorRegionZoom,
      duration: 350,
    });
  };

  const recenterOnSearchOrigin = () => {
    if (!canRecenterOnSearchOrigin || !searchOrigin) return;
    onRequestMapRecenter(() => {
      setSearchOriginCenterRequest((request) => request + 1);
    });
  };

  return (
    <>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.mapHeading}>
        <Feather name="map-pin" size={18} color={colors.primary} />
        <Text style={styles.headingText}>
          {nearMeActive ? `Tutors within about ${maximumDistanceKm} km` : 'Tutors nearby'}
        </Text>
      </View>
      {mapRegion ? (
        <View style={styles.mapFrame}>
          {!mapExpanded ? (
            <MapCanvas
              cameraRef={mapCameraRef}
              mapRegion={mapRegion}
              recenterRequest={searchOriginCenterRequest}
              initialZoom={initialZoom}
              locatedTutors={locatedTutors}
              selectedTutor={selectedTutor}
              onSelectTutor={setSelectedTutorId}
              nearMeActive={nearMeActive}
              searchOrigin={searchOrigin}
              searchOriginSource={searchOriginSource}
              searchOriginMarkerLabel={searchOriginMarkerLabel}
              searchOriginMarkerText={searchOriginMarkerText}
              onMapReady={() => setZoom(initialZoom)}
              onZoomChange={adjustZoom}
              onCenterTutors={recenter}
              canRecenterOnSearchOrigin={canRecenterOnSearchOrigin}
              searchOriginLabel={searchOriginLabel}
              onRecenterOnSearchOrigin={recenterOnSearchOrigin}
              onToggleExpanded={() => setMapExpanded(true)}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.noMapLocations}>
          <Feather name="map" size={26} color={colors.mutedText} />
          <Text style={styles.noMapTitle}>
            {nearMeActive && !locatedTutors.length
              ? `No tutors with mapped locations found within about ${maximumDistanceKm} km`
              : 'Tutor locations aren’t available yet'}
          </Text>
          <Text style={styles.noMapMessage}>
            {nearMeActive && !locatedTutors.length
              ? tutorsWithoutLocation.length
                ? 'Tutors without usable locations remain listed below and cannot be checked against this distance limit. Show all tutors to see every available map pin.'
                : 'Try changing your search filters or show all tutors to see every available map pin.'
              : 'Tutors can still be found and booked below. Approximate pins will appear when locations are added.'}
          </Text>
          {canRecenterOnSearchOrigin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Center map on ${searchOriginLabel}`}
              onPress={recenterOnSearchOrigin}
              style={styles.noMapRecenterButton}
            >
              <Text style={styles.noMapRecenterText}>Show map around {searchOriginLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {mapRegion && nearMeActive && !locatedTutors.length && !tutorsWithoutLocation.length ? (
        <Text style={styles.sectionDescription}>
          No tutors with mapped locations were found within about {maximumDistanceKm} km.
        </Text>
      ) : null}

      <Text style={styles.approximateNote}>
        {nearMeActive
          ? 'Results use approximate straight-line distance from your search origin to each tutor’s listed city or area. Tutors without location data remain listed separately; this is not driving distance.'
          : 'Pins and distances are approximate to each tutor’s listed city or area, not their home address.'}
      </Text>

      {selectedTutor ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected tutor</Text>
          <TutorCard
            tutor={selectedTutor}
            approximateDistance={formatApproximateDistance(selectedTutor.distanceKm)}
            handlePress={() => onTutorPress(selectedTutor)}
          />
        </View>
      ) : null}

      {tutorsWithoutLocation.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location not available yet</Text>
          <Text style={styles.sectionDescription}>
            These approved tutors are still available to book. No pin or distance is shown until they have a usable city or area.
          </Text>
          {tutorsWithoutLocation.map((tutor) => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              handlePress={() => onTutorPress(tutor)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
    <Modal
      visible={mapExpanded && Boolean(mapRegion)}
      animationType="slide"
      onRequestClose={() => setMapExpanded(false)}
    >
      {mapRegion ? (
        <SafeAreaView edges={['top', 'bottom']} style={styles.expandedMapContainer}>
          <View style={styles.expandedMapFrame}>
            <MapCanvas
              cameraRef={expandedMapRef}
              mapRegion={mapRegion}
              recenterRequest={searchOriginCenterRequest}
              initialZoom={initialZoom}
              locatedTutors={locatedTutors}
              selectedTutor={selectedTutor}
              onSelectTutor={setSelectedTutorId}
              nearMeActive={nearMeActive}
              searchOrigin={searchOrigin}
              searchOriginSource={searchOriginSource}
              searchOriginMarkerLabel={searchOriginMarkerLabel}
              searchOriginMarkerText={searchOriginMarkerText}
              onMapReady={() => setZoom(initialZoom)}
              onZoomChange={adjustZoom}
              onCenterTutors={recenter}
              canRecenterOnSearchOrigin={canRecenterOnSearchOrigin}
              searchOriginLabel={searchOriginLabel}
              onRecenterOnSearchOrigin={recenterOnSearchOrigin}
              expanded
              onCloseExpanded={() => setMapExpanded(false)}
            />
          </View>
        </SafeAreaView>
      ) : null}
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  mapHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headingText: {
    ...typography.sectionTitle,
    flex: 1,
  },
  mapFrame: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 340,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  expandedMapContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  expandedMapFrame: {
    flex: 1,
  },
  mapControls: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 1,
  },
  mapControl: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  markerSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    height: 48,
    width: 48,
  },
  searchOriginMarker: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    elevation: 4,
    justifyContent: 'center',
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchOriginMarkerText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  noMapLocations: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 220,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  noMapTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noMapMessage: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  noMapRecenterButton: {
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  noMapRecenterText: {
    color: colors.primary,
    ...typography.label,
    textAlign: 'center',
  },
  approximateNote: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
