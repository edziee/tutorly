import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MapView, { Marker } from 'react-native-maps';

import TutorCard from '../../components/TutorCard';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { formatApproximateDistance } from '../../utils/geolocation';
import { getTutorMapRegion, splitTutorsByMapLocation } from '../../utils/tutorMap';

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
  const mapRef = useRef(null);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [shownSearchOriginKey, setShownSearchOriginKey] = useState(null);
  const { locatedTutors, tutorsWithoutLocation } = useMemo(
    () => splitTutorsByMapLocation(tutors),
    [tutors],
  );
  const region = useMemo(
    () => getTutorMapRegion(locatedTutors),
    [locatedTutors],
  );
  const searchOriginKey = searchOrigin
    ? `${searchOrigin.latitude}:${searchOrigin.longitude}`
    : null;
  const mapRegion = region ?? (
    searchOrigin && shownSearchOriginKey === searchOriginKey
    ? { ...searchOrigin, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : null);
  useEffect(() => {
    if (!nearMeActive) setShownSearchOriginKey(null);
  }, [nearMeActive]);
  const initialZoom = mapRegion
    ? Math.min(19, Math.max(4, Math.round(Math.log2(360 / mapRegion.longitudeDelta))))
    : 13;
  const selectedTutor = locatedTutors.find((tutor) => tutor.id === selectedTutorId)
    ?? locatedTutors[0]
    ?? null;
  const searchOriginLabel = searchOriginSource === 'device'
    ? 'your current location'
    : 'your saved address';

  const adjustZoom = (amount) => {
    const nextZoom = Math.min(19, Math.max(4, zoom + amount));
    setZoom(nextZoom);
    mapRef.current?.animateCamera({ zoom: nextZoom });
  };

  const recenter = () => {
    if (!mapRegion) return;
    setZoom(initialZoom);
    mapRef.current?.animateToRegion(mapRegion, 350);
  };

  const recenterOnSearchOrigin = () => {
    if (!canRecenterOnSearchOrigin || !searchOrigin) return;
    onRequestMapRecenter(() => {
      if (!region) {
        setShownSearchOriginKey(searchOriginKey);
        return;
      }
      mapRef.current?.animateToRegion({
        ...searchOrigin,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 350);
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mapHeading}>
        <Feather name="map-pin" size={18} color={colors.primary} />
        <Text style={styles.headingText}>
          {nearMeActive ? `Tutors within about ${maximumDistanceKm} km` : 'Tutors nearby'}
        </Text>
      </View>
      {mapRegion ? (
        <View style={styles.mapFrame}>
          <MapView
            key={`${mapRegion.latitude.toFixed(4)}:${mapRegion.longitude.toFixed(4)}:${mapRegion.latitudeDelta.toFixed(4)}:${mapRegion.longitudeDelta.toFixed(4)}`}
            ref={mapRef}
            initialRegion={mapRegion}
            onMapReady={() => setZoom(initialZoom)}
            style={styles.map}
          >
            {locatedTutors.map((tutor, index) => {
              const isSelected = tutor.id === selectedTutor?.id;
              const initials = (tutor.name || 'Tutor')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase();
              return (
                <Marker
                  key={tutor.id}
                  coordinate={tutor.mapCoordinates}
                  title={tutor.name || 'Tutor'}
                  description="Approximate tutor location"
                  onPress={() => setSelectedTutorId(tutor.id)}
                >
                  <View
                    accessibilityLabel={`${tutor.name || 'Tutor'} approximate map marker`}
                    style={[styles.marker, isSelected && styles.markerSelected]}
                  >
                    {tutor.photoUrl ? (
                      <Image source={{ uri: tutor.photoUrl }} style={styles.markerImage} />
                    ) : (
                      <Text style={[styles.markerInitials, isSelected && styles.markerInitialsSelected]}>
                        {initials || String(index + 1)}
                      </Text>
                    )}
                  </View>
                </Marker>
              );
            })}
          </MapView>
          <View style={styles.mapControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              onPress={() => adjustZoom(1)}
              style={styles.mapControl}
            >
              <Feather name="plus" size={20} color={colors.heading} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              onPress={() => adjustZoom(-1)}
              style={styles.mapControl}
            >
              <Feather name="minus" size={20} color={colors.heading} />
            </Pressable>
            {region ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Center map on tutors"
                onPress={recenter}
                style={styles.mapControl}
              >
                <Feather name="crosshair" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            {canRecenterOnSearchOrigin && searchOrigin ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Center map on ${searchOriginLabel}`}
                onPress={recenterOnSearchOrigin}
                style={styles.mapControl}
              >
                <Feather name="navigation" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
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
    flex: 1,
  },
  mapControls: {
    gap: spacing.xs,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
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
  markerImage: {
    height: '100%',
    width: '100%',
  },
  markerInitials: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  markerInitialsSelected: {
    color: colors.primary,
    fontSize: 14,
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
    marginTop: spacing.sm,
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
