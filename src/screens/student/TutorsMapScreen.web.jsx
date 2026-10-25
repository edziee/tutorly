import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const icon = useMemo(() => L.divIcon({
    className: `tutor-map-marker${selected ? ' tutor-map-marker-selected' : ''}`,
    html: `<span>${escapeHtml(initials || 'T')}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  }), [initials, selected]);

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

function RecenterMap({ region, searchOrigin, recenterRequest }) {
  const map = useMap();
  const previousRecenterRequest = useRef(recenterRequest);
  useEffect(() => {
    map.setView([region.latitude, region.longitude], map.getZoom(), { animate: false });
  }, [map, region.latitude, region.longitude]);
  useEffect(() => {
    if (recenterRequest > previousRecenterRequest.current && searchOrigin) {
      map.setView(
        [searchOrigin.latitude, searchOrigin.longitude],
        Math.max(13, map.getZoom()),
        { animate: true },
      );
    }
    previousRecenterRequest.current = recenterRequest;
  }, [map, recenterRequest, searchOrigin]);
  return null;
}

export default function TutorsMapScreen({
  tutors,
  nearMeActive = false,
  maximumDistanceKm,
  canRecenterOnSearchOrigin = false,
  searchOrigin,
  searchOriginSource,
  onRequestMapRecenter,
  mapRecenterRequest = 0,
  onTutorPress,
}) {
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [shownSearchOriginKey, setShownSearchOriginKey] = useState(null);
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
  const searchOriginKey = searchOrigin
    ? `${searchOrigin.latitude}:${searchOrigin.longitude}`
    : null;
  const mapRegion = region ?? (
    searchOrigin && shownSearchOriginKey === searchOriginKey
    ? { ...searchOrigin, longitudeDelta: 0.08 }
    : null);
  useEffect(() => {
    if (!nearMeActive) setShownSearchOriginKey(null);
  }, [nearMeActive]);
  const searchOriginLabel = searchOriginSource === 'device'
    ? 'your current location'
    : 'your saved address';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mapHeading}>
        <Text style={styles.headingText}>
          {nearMeActive ? `Tutors within about ${maximumDistanceKm} km` : 'Tutors nearby'}
        </Text>
      </View>
      {mapRegion ? (
        <View style={styles.mapFrame}>
          <MapContainer
            center={[mapRegion.latitude, mapRegion.longitude]}
            zoom={Math.min(18, Math.max(5, Math.round(Math.log2(360 / mapRegion.longitudeDelta))))}
            scrollWheelZoom
            style={styles.map}
          >
            <RecenterMap
              region={mapRegion}
              searchOrigin={searchOrigin}
              recenterRequest={mapRecenterRequest}
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
                onSelect={setSelectedTutorId}
              />
            ))}
          </MapContainer>
          {canRecenterOnSearchOrigin && searchOrigin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Center map on ${searchOriginLabel}`}
              onPress={() => onRequestMapRecenter(() => {
                if (!region) setShownSearchOriginKey(searchOriginKey);
              })}
              style={styles.mapControl}
            >
              <Feather name="navigation" size={18} color={colors.primary} />
            </Pressable>
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
              onPress={() => onRequestMapRecenter(() => setShownSearchOriginKey(searchOriginKey))}
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
    paddingHorizontal: spacing.xs,
  },
  headingText: {
    color: colors.heading,
    fontSize: 17,
    fontWeight: '700',
  },
  mapFrame: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 340,
    overflow: 'hidden',
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
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 40,
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
    color: colors.heading,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  noMapMessage: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  noMapRecenterButton: {
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  noMapRecenterText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  approximateNote: {
    color: colors.mutedText,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.heading,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionDescription: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
