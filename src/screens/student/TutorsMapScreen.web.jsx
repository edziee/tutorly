import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './TutorsMapScreen.web.css';

import TutorCard from '../../components/TutorCard';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatApproximateDistance } from '../../utils/geolocation';
import { getTutorMapRegion, splitTutorsByMapLocation } from '../../utils/tutorMap';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function TutorMarker({ tutor, selected, onSelect }) {
  const initials = (tutor.name || 'Tutor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const markerContent = tutor.photoUrl
    ? `<img src="${escapeHtml(tutor.photoUrl)}" alt="" />`
    : `<span>${escapeHtml(initials || 'T')}</span>`;
  const icon = useMemo(() => L.divIcon({
    className: `tutor-map-marker${selected ? ' tutor-map-marker-selected' : ''}`,
    html: markerContent,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  }), [markerContent, selected]);

  return (
    <Marker
      icon={icon}
      position={[tutor.mapCoordinates.latitude, tutor.mapCoordinates.longitude]}
      eventHandlers={{ click: () => onSelect(tutor.id) }}
    >
      <Popup>
        <Text style={styles.popupText}>{tutor.name || 'Tutor'} · Approximate area</Text>
      </Popup>
    </Marker>
  );
}

function SearchOriginMarker({ searchOrigin, label, markerText }) {
  const icon = useMemo(() => L.divIcon({
    className: 'search-origin-marker',
    html: `<span>${markerText}</span>`,
    iconSize: [64, 32],
    iconAnchor: [32, 16],
  }), [markerText]);

  return (
    <Marker
      icon={icon}
      position={[searchOrigin.latitude, searchOrigin.longitude]}
      title={label}
    >
      <Popup>
        <Text style={styles.popupText}>{label}</Text>
      </Popup>
    </Marker>
  );
}

function RecenterMap({ region }) {
  const map = useMap();
  useEffect(() => {
    const zoom = Math.min(18, Math.max(5, Math.round(Math.log2(360 / region.longitudeDelta))));
    map.setView([region.latitude, region.longitude], zoom, { animate: true });
  }, [map, region.latitude, region.longitude, region.longitudeDelta]);
  return null;
}

function MapCanvas({
  mapRegion,
  recenterRequest,
  searchOrigin,
  locatedTutors,
  selectedTutor,
  onSelectTutor,
  nearMeActive,
  searchOriginSource,
  searchOriginMarkerLabel,
  searchOriginMarkerText,
  expanded,
  canRecenterOnSearchOrigin,
  searchOriginLabel,
  onRecenterOnSearchOrigin,
  onToggleExpanded,
  onCloseExpanded,
}) {
  return (
    <>
      <MapContainer
        key={`${expanded ? 'expanded-map' : 'inline-map'}:${recenterRequest}`}
        center={[mapRegion.latitude, mapRegion.longitude]}
        zoom={Math.min(18, Math.max(5, Math.round(Math.log2(360 / mapRegion.longitudeDelta))))}
        scrollWheelZoom
        style={styles.map}
      >
        <RecenterMap
          region={mapRegion}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locatedTutors.map((tutor) => (
          <TutorMarker
            key={tutor.id}
            tutor={tutor}
            selected={tutor.id === selectedTutor?.id}
            onSelect={onSelectTutor}
          />
        ))}
        {nearMeActive && searchOrigin && searchOriginSource ? (
          <SearchOriginMarker
            searchOrigin={searchOrigin}
            label={searchOriginMarkerLabel}
            markerText={searchOriginMarkerText}
          />
        ) : null}
      </MapContainer>
      <View style={styles.mapControls}>
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
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [searchOriginCenterRequest, setSearchOriginCenterRequest] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const { locatedTutors, tutorsWithoutLocation } = useMemo(
    () => splitTutorsByMapLocation(tutors),
    [tutors],
  );
  const region = useMemo(
    () => getTutorMapRegion(locatedTutors),
    [locatedTutors],
  );
  const selectedTutor = locatedTutors.find((tutor) => tutor.id === selectedTutorId)
    ?? locatedTutors[0]
    ?? null;
  useEffect(() => {
    if (!nearMeActive || !searchOrigin) setSearchOriginCenterRequest(0);
  }, [nearMeActive, searchOrigin]);
  const mapRegion = searchOriginCenterRequest > 0 && nearMeActive && searchOrigin
    ? { ...searchOrigin, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : region;
  const searchOriginLabel = searchOriginSource === 'device'
    ? 'your current location'
    : 'your saved address';
  const searchOriginMarkerLabel = searchOriginSource === 'device'
    ? 'You (approximate location)'
    : 'Saved address (approximate)';
  const searchOriginMarkerText = searchOriginSource === 'device' ? 'You' : 'Address';

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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.mapHeading}>
        <Text style={styles.headingText}>
          {nearMeActive ? `Tutors within about ${maximumDistanceKm} km` : 'Tutors nearby'}
        </Text>
      </View>
      {mapRegion ? (
        <View style={styles.mapFrame}>
          {!mapExpanded ? (
            <MapCanvas
              mapRegion={mapRegion}
              recenterRequest={searchOriginCenterRequest}
              searchOrigin={searchOrigin}
              locatedTutors={locatedTutors}
              selectedTutor={selectedTutor}
              onSelectTutor={setSelectedTutorId}
              nearMeActive={nearMeActive}
              searchOriginSource={searchOriginSource}
              searchOriginMarkerLabel={searchOriginMarkerLabel}
              searchOriginMarkerText={searchOriginMarkerText}
              canRecenterOnSearchOrigin={canRecenterOnSearchOrigin}
              searchOriginLabel={searchOriginLabel}
              onRecenterOnSearchOrigin={recenterOnSearchOrigin}
              onToggleExpanded={() => setMapExpanded(true)}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.noMapLocations}>
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
          ? 'Results use approximate straight-line distance from your search origin to each tutor’s listed city or area. Tutors without location data remain listed separately; this is not driving distance. Map tiles are provided by OpenStreetMap.'
          : 'Pins and distances are approximate to each tutor’s listed city or area, not their home address. Map tiles are provided by OpenStreetMap.'}
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
              mapRegion={mapRegion}
              recenterRequest={searchOriginCenterRequest}
              searchOrigin={searchOrigin}
              locatedTutors={locatedTutors}
              selectedTutor={selectedTutor}
              onSelectTutor={setSelectedTutorId}
              nearMeActive={nearMeActive}
              searchOriginSource={searchOriginSource}
              searchOriginMarkerLabel={searchOriginMarkerLabel}
              searchOriginMarkerText={searchOriginMarkerText}
              expanded
              canRecenterOnSearchOrigin={canRecenterOnSearchOrigin}
              searchOriginLabel={searchOriginLabel}
              onRecenterOnSearchOrigin={recenterOnSearchOrigin}
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
  expandedMapContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  expandedMapFrame: {
    flex: 1,
  },
  map: {
    height: '100%',
    width: '100%',
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
  mapControls: {
    gap: spacing.xs,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 1,
  },
  popupText: {
    color: colors.heading,
    fontSize: 13,
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
