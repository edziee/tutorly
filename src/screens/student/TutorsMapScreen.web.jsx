import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

function RecenterMap({ region }) {
  const map = useMap();
  useEffect(() => {
    map.setView([region.latitude, region.longitude], map.getZoom(), { animate: false });
  }, [map, region.latitude, region.longitude]);
  return null;
}

export default function TutorsMapScreen({
  tutors,
  onTutorPress,
}) {
  const [selectedTutorId, setSelectedTutorId] = useState(null);
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

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mapHeading}>
        <Text style={styles.headingText}>Tutors nearby</Text>
      </View>
      {region ? (
        <View style={styles.mapFrame}>
          <MapContainer
            center={[region.latitude, region.longitude]}
            zoom={Math.min(18, Math.max(5, Math.round(Math.log2(360 / region.longitudeDelta))))}
            scrollWheelZoom
            style={styles.map}
          >
            <RecenterMap region={region} />
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
        </View>
      ) : (
        <View style={styles.noMapLocations}>
          <Text style={styles.noMapTitle}>Tutor locations aren’t available yet</Text>
          <Text style={styles.noMapMessage}>
            Tutors can still be found and booked below. Approximate pins will appear when locations are added.
          </Text>
        </View>
      )}

      <Text style={styles.approximateNote}>
        Pins and distances are approximate to each tutor’s listed city or area, not their home address. Map tiles are provided by OpenStreetMap.
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
