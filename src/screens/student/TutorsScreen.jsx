import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';

import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import TutorCard from '../../components/TutorCard';
import TutorsMapScreen from './TutorsMapScreen';
import { ROUTES } from '../../constants/routes';
import { courseCategories } from '../../data/courseCategories';
import { tierCategories } from '../../data/tierCategories';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getTutors } from '../../services/tutorService';
import {
  getStudentSearchOrigin,
  recordGeolocationConsent,
} from '../../services/locationService';
import { sortByDistanceWithinRadius } from '../../utils/distance';
import { getErrorMessage } from '../../utils/errors';
import {
  coordinatesFromLocationCell,
  toLocationCell,
} from '../../utils/geolocation';

const MAX_NEARBY_DISTANCE_KM = 10;

export const TutorsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const tutorResults = useAsync(() => getTutors(), []);
  const [textInput, setTextInput] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [tierCategory, setTierCategory] = useState('');
  const [courses, setCourses] = useState(courseCategories);
  const [tiers, setTiers] = useState(tierCategories);
  const [viewMode, setViewMode] = useState('list');
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeStatus, setNearMeStatus] = useState('idle');
  const [nearMeMessage, setNearMeMessage] = useState('');
  const [nearMeNotice, setNearMeNotice] = useState('');
  const [nearMeOrigin, setNearMeOrigin] = useState(null);
  const [nearMeOriginSource, setNearMeOriginSource] = useState(null);
  const [mapProviderConsentGranted, setMapProviderConsentGranted] = useState(false);

  const askLocationConsent = () => new Promise((resolve) => {
    Alert.alert(
      'Near me location policy',
      'Tutorly uses your foreground device location only for this search and does not save those coordinates. If you tap the map recenter button, an approximate location is sent to the map provider to load the map. If device location is unavailable, your saved private home address may be geocoded and cached in your private profile. Tutorly records your consent decision and time. Tutor addresses and exact coordinates are never shown. Do you agree?',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Agree and continue', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });

  const runNearMeSearch = async () => {
    if (nearMeStatus === 'loading') return;

    setNearMeStatus('loading');
    setNearMeMessage('');
    setNearMeNotice('');
    setNearMeOrigin(null);
    setNearMeOriginSource(null);
    try {
      let consented = user.geolocationConsent === true;
      if (!consented) {
        consented = await askLocationConsent();
        await recordGeolocationConsent(user.uid, consented);
      }
      if (!consented) {
        setNearMeActive(true);
        setNearMeStatus('error');
        setNearMeMessage('Near me needs your consent to use location for this search. You can retry whenever you’re ready.');
        return;
      }
      if (user.geolocationConsent !== true) setMapProviderConsentGranted(true);

      const origin = await getStudentSearchOrigin({
        ...user,
        geolocationConsent: true,
      });
      setNearMeActive(true);
      setNearMeOrigin(origin.coordinates);
      setNearMeOriginSource(origin.source);
      setNearMeNotice(origin.notice);
      setNearMeStatus('ready');
    } catch (error) {
      setNearMeActive(true);
      setNearMeStatus('error');
      setNearMeMessage(getErrorMessage(error, 'Location could not be determined. Retry or update your profile.'));
    }
  };

  const handleNearMePress = async () => {
    if (nearMeStatus === 'loading') return;
    if (nearMeActive) {
      setNearMeActive(false);
      setNearMeStatus('idle');
      setNearMeOrigin(null);
      setNearMeOriginSource(null);
      setNearMeMessage('');
      setNearMeNotice('');
      return;
    }
    await runNearMeSearch();
  };

  const handleViewChange = (nextView) => {
    if (nearMeStatus === 'loading' || nextView === viewMode) return;
    setViewMode(nextView);
    if (nextView === 'list') {
      setNearMeActive(false);
      setNearMeStatus('idle');
      setNearMeMessage('');
      setNearMeNotice('');
      setNearMeOrigin(null);
      setNearMeOriginSource(null);
    }
  };

  const handleMapRecenter = (onContinue) => {
    if (mapProviderConsentGranted) {
      onContinue();
      return;
    }
    Alert.alert(
      'Share approximate map location?',
      'To center the map, an approximate location is sent to the map provider to load nearby map tiles. Your exact device coordinates are not sent or saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            setMapProviderConsentGranted(true);
            onContinue();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleCoursePress = (selectedCourse) => {
    setCourses(courses.map((course) => ({
      ...course,
      isSelected: course.id === selectedCourse.id,
    })));
    setCourseCategory(selectedCourse.keyword);
  };

  const handleTierPress = (selectedTier) => {
    setTiers(tiers.map((tier) => ({
      ...tier,
      isSelected: tier.id === selectedTier.id,
    })));
    setTierCategory(selectedTier.keyword);
  };

  const sanitizeString = (value) => value.trim().toLowerCase();
  const filteredTutors = (tutorResults.data ?? []).filter((tutor) =>
    (sanitizeString(tutor.name ?? '').includes(sanitizeString(textInput)) ||
      sanitizeString(tutor.subject ?? '').includes(sanitizeString(textInput))) &&
    sanitizeString(tutor.subject ?? '').includes(sanitizeString(courseCategory)) &&
    sanitizeString(tutor.tier ?? '').includes(sanitizeString(tierCategory)));
  const nearbyTutors = nearMeOrigin
    ? sortByDistanceWithinRadius(
        filteredTutors,
        nearMeOrigin,
        MAX_NEARBY_DISTANCE_KM,
        (tutor) => tutor.locationCellVersion === 1
          ? coordinatesFromLocationCell(tutor.locationCell)
          : null,
      )
    : [];
  const displayedTutors = nearMeActive && nearMeOrigin
    ? nearbyTutors
    : filteredTutors;
  const mapSearchOrigin = useMemo(
    () => nearMeOrigin
      ? coordinatesFromLocationCell(toLocationCell(nearMeOrigin))
      : null,
    [nearMeOrigin],
  );
  const nearMeSourceLabel = nearMeOriginSource === 'device'
    ? 'Using your device location'
    : 'Using your saved address';
  const openTutor = (tutor) => navigation.navigate(ROUTES.BOOKING, { tutor });

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={colors.mutedText} />
        <TextInput
          accessibilityLabel="Search courses or tutors"
          onChangeText={setTextInput}
          placeholder="Search courses or tutors"
          placeholderTextColor={colors.mutedText}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        data={courses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.isSelected }}
            onPress={() => handleCoursePress(item)}
            style={[
              styles.courseChip,
              item.isSelected && styles.selectedCourseChip,
            ]}
          >
            <Text style={[styles.courseText, item.isSelected && styles.selectedCourseText]}>
              {item.label}
            </Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.courseList}
        style={styles.courseFilter}
      />

      <View style={styles.tierFilter}>
        <View style={styles.tierHeading}>
          <Octicons name="stack" size={16} color={colors.primary} />
          <Text style={styles.tierHeadingText}>Tutor type</Text>
        </View>
        <FlatList
          horizontal
          data={tiers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.isSelected }}
              onPress={() => handleTierPress(item)}
              style={styles.tierChip}
            >
              <Text style={[styles.tierText, item.isSelected && styles.selectedTierText]}>
                {item.label}
              </Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierList}
          style={styles.tierOptions}
        />
      </View>

      <View style={styles.discoveryControls}>
        <View accessibilityRole="tablist" style={styles.viewSwitcher}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === 'list' }}
            disabled={nearMeStatus === 'loading'}
            onPress={() => handleViewChange('list')}
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonSelected]}
          >
            <Feather
              name="list"
              size={15}
              color={viewMode === 'list' ? colors.primary : colors.mutedText}
            />
            <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextSelected]}>
              List
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === 'map' }}
            disabled={nearMeStatus === 'loading'}
            onPress={() => handleViewChange('map')}
            style={[styles.viewButton, viewMode === 'map' && styles.viewButtonSelected]}
          >
            <Feather
              name="map"
              size={15}
              color={viewMode === 'map' ? colors.primary : colors.mutedText}
            />
            <Text style={[styles.viewButtonText, viewMode === 'map' && styles.viewButtonTextSelected]}>
              Map View
            </Text>
          </Pressable>
        </View>
        {viewMode === 'map' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              selected: nearMeActive,
              disabled: nearMeStatus === 'loading',
            }}
            disabled={nearMeStatus === 'loading'}
            onPress={handleNearMePress}
            style={[
              styles.nearMeButton,
              nearMeActive && styles.nearMeButtonSelected,
              nearMeStatus === 'loading' && styles.nearMeButtonDisabled,
            ]}
          >
            <Feather
              name={nearMeActive ? 'users' : 'map-pin'}
              size={16}
              color={nearMeActive ? colors.white : colors.primary}
            />
            <Text style={[styles.nearMeButtonText, nearMeActive && styles.nearMeButtonTextSelected]}>
              {nearMeStatus === 'loading'
                ? 'Finding tutors...'
                : nearMeActive
                  ? 'Show all tutors'
                  : 'Near me'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {viewMode === 'map' && nearMeStatus === 'ready' && nearMeOriginSource ? (
        <View style={styles.nearMeNoticeBox}>
          <Text accessibilityRole="text" style={styles.nearMeSource}>
            {nearMeSourceLabel}
          </Text>
          {nearMeOriginSource === 'device' ? (
            <Text style={styles.nearMeNotice}>
              Used for this search only; your device coordinates aren’t saved.
            </Text>
          ) : (
            <Text style={styles.nearMeNotice}>{nearMeNotice}</Text>
          )}
          {nearMeOriginSource === 'saved-address' ? (
            <Pressable
              accessibilityRole="button"
              onPress={runNearMeSearch}
              style={styles.profileUpdateButton}
            >
              <Text style={styles.profileUpdateButtonText}>Retry location</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {viewMode === 'map' && nearMeStatus === 'error' ? (
        <View style={styles.nearMeMessageBox}>
          <Text accessibilityRole="alert" style={styles.nearMeMessage}>
            {nearMeMessage}
          </Text>
          <View style={styles.nearMeActions}>
            <Pressable
              accessibilityRole="button"
              onPress={runNearMeSearch}
              style={styles.profileUpdateButton}
            >
              <Text style={styles.profileUpdateButtonText}>Retry</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate(ROUTES.PROFILE)}
              style={styles.profileUpdateButton}
            >
              <Text style={styles.profileUpdateButtonText}>Update profile</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.results}>
        {tutorResults.status === 'loading' ? (
          <LoadingState compact message="Loading tutors..." />
        ) : tutorResults.status === 'error' ? (
          <ErrorState
            compact
            title="Tutors aren’t available"
            message={getErrorMessage(tutorResults.error)}
            onRetry={tutorResults.retry}
          />
        ) : viewMode === 'map' ? (
          <TutorsMapScreen
            tutors={displayedTutors}
            nearMeActive={nearMeActive && Boolean(nearMeOrigin)}
            maximumDistanceKm={MAX_NEARBY_DISTANCE_KM}
            canRecenterOnSearchOrigin={nearMeActive && Boolean(nearMeOrigin)}
            searchOrigin={mapSearchOrigin}
            searchOriginSource={nearMeOriginSource}
            onRequestMapRecenter={handleMapRecenter}
            onTutorPress={openTutor}
          />
        ) : displayedTutors.length ? (
          <FlatList
            data={displayedTutors}
            renderItem={({ item }) => (
              <TutorCard tutor={item} handlePress={() => openTutor(item)} />
            )}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tutorList}
          />
        ) : (
          <EmptyState
            compact
            icon="people-outline"
            title="No tutors found"
            message="Try another course or check back soon."
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  nearMeButton: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nearMeButtonSelected: {
    backgroundColor: colors.primary,
  },
  nearMeButtonDisabled: {
    opacity: 0.65,
  },
  discoveryControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  viewSwitcher: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  viewButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewButtonSelected: {
    backgroundColor: colors.surface,
  },
  viewButtonText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  viewButtonTextSelected: {
    color: colors.primary,
  },
  nearMeButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  nearMeButtonTextSelected: {
    color: colors.white,
  },
  nearMeNoticeBox: {
    marginBottom: spacing.sm,
  },
  nearMeSource: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  nearMeNotice: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  nearMeMessageBox: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  nearMeMessage: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  nearMeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileUpdateButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  profileUpdateButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  courseFilter: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  courseList: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  courseChip: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedCourseChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  courseText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedCourseText: {
    color: colors.white,
  },
  tierFilter: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tierHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  tierHeadingText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  tierOptions: {
    flexGrow: 0,
    marginTop: spacing.xs,
  },
  tierList: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  tierChip: {
    flexShrink: 0,
    paddingVertical: spacing.xs,
  },
  tierText: {
    color: colors.text,
    fontSize: 12,
  },
  selectedTierText: {
    color: colors.primary,
    fontWeight: '800',
  },
  results: {
    flex: 1,
    minHeight: 0,
  },
  tutorList: {
    paddingBottom: spacing.lg,
  },
});
