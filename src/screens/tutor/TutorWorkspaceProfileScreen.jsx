import { formatRecordedDuration } from '../../utils/sessionTimer';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import WorkspaceSwitchCard from '../../components/WorkspaceSwitchCard';
import TokenBalanceIndicator from '../../components/TokenBalanceIndicator';
import { openTutorApplication } from '../../navigation/studentNavigationActions';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import {
  STUDENT_BADGES,
  STUDENT_BADGE_BY_ID,
  TUTOR_ACHIEVEMENTS,
} from '../../constants/gamification';
import {
  BOOKING_STATUS,
  TOKEN_BOOKING_STATUS,
  TUTOR_TYPES,
} from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useSubscription } from '../../hooks/useSubscription';
import {
  getTutorApplication,
  getTutors,
  updateTutorBookingDetails,
} from '../../services/tutorService';
import {
  awardStudentBadge,
  setTutorAchievementVisibility,
  subscribeToTutorAchievements,
  subscribeToTutorAchievementVisibility,
  subscribeToTutorBadgeAwards,
} from '../../services/badgeService';
import {
  subscribeToTutorBookings,
  updateBookingStatus,
} from '../../services/bookingService';
import { getAuthErrorMessage, getErrorMessage } from '../../utils/errors';
import { canUseTutorOperations, hasDirectTutorAccountStatus } from '../../utils/workspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getTutorLeaderboards, TOP_RATED_MINIMUM_REVIEWS } from '../../utils/leaderboards';
import { formatTokenUnits } from '../../utils/tokens';
import { getMinimumTutorRate, getTutorRateError } from '../../utils/tutorPricing';

const COMMON_CITY_SUGGESTIONS = [
  'Quezon City',
  'Manila',
  'Makati',
  'Pasig',
  'Taguig',
  'Marikina',
  'Mandaluyong',
  'Pasay',
  'Parañaque',
  'Las Piñas',
  'Muntinlupa',
  'Caloocan',
  'Antipolo',
  'Cebu City',
  'Davao City',
  'Baguio City',
  'Iloilo City',
  'Cagayan de Oro',
];

function SectionTitle({ title, subtitle, action }) {
  return (
    <View style={styles.sectionTitle}>
      <View>
        <Text style={styles.sectionHeading}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function Badge({ children }) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{children}</Text></View>;
}

function RequestCard({ request, onAccept, onDecline, working }) {
  const canAccept = request.tokenStatus === TOKEN_BOOKING_STATUS.PENDING;
  return (
    <View>
      <View style={styles.requestCard}>
        <View style={styles.requestAvatar}><Text style={styles.requestInitial}>{(request.studentName || 'S').charAt(0)}</Text></View>
        <View style={styles.requestCopy}>
          <Text style={styles.requestName}>{request.studentName || 'Student'}</Text>
          <Text style={styles.requestMeta}>{request.subject} · {request.dateKey} · {request.startTime}</Text>
          {request.notes ? <Text style={styles.requestNote}>{request.notes}</Text> : null}
        </View>
        <Text style={styles.requestAmount}>
          {formatTokenUnits(request.tokenAmountUnits)} tokens
        </Text>
      </View>
      {!canAccept ? (
        <Text style={styles.formError}>
          This older payment request can’t be accepted. Ask the student to submit a new token booking, then decline this request.
        </Text>
      ) : null}
      <View style={styles.requestActions}>
        {canAccept ? (
          <AppButton title="Accept" variant="secondary" onPress={onAccept} loading={working} />
        ) : null}
        <AppButton title="Decline" variant="outline" onPress={onDecline} disabled={working} />
      </View>
    </View>
  );
}

function LeaderboardRow({ tutor, rank, mode }) {
  const isHours = mode === 'hours';
  const score = isHours
    ? `${Number(tutor.hoursTaught.toFixed(1))} hrs`
    : `${tutor.averageRating.toFixed(1)} ★`;
  const detail = isHours
    ? 'recorded teaching'
    : `${tutor.reviewCount} review${tutor.reviewCount === 1 ? '' : 's'}`;

  return (
    <View style={styles.leaderboardRow}>
      <View style={styles.leaderboardRank}>
        <Text style={styles.leaderboardRankText}>{rank}</Text>
      </View>
      <View style={styles.leaderboardIdentity}>
        <Text numberOfLines={1} style={styles.leaderboardName}>{tutor.name}</Text>
        <Text style={styles.leaderboardDetail}>{detail}</Text>
      </View>
      <Text style={styles.leaderboardScore}>{score}</Text>
    </View>
  );
}

export default function TutorWorkspaceProfileScreen({ navigation }) {
  const { user, signOut, updateProfile, setWorkspaceMode, workspaceModeError } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [application, setApplication] = useState(null);
  const [location, setLocation] = useState(user?.location ?? '');
  const [locationDraft, setLocationDraft] = useState(user?.location ?? '');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress ?? '');
  const [homeAddressDraft, setHomeAddressDraft] = useState(user?.homeAddress ?? '');
  const [homeAddressEditorVisible, setHomeAddressEditorVisible] = useState(false);
  const [savingHomeAddress, setSavingHomeAddress] = useState(false);
  const [homeAddressError, setHomeAddressError] = useState('');
  const normalizedLocationQuery = locationDraft.trim().toLowerCase();
  const locationSuggestions = COMMON_CITY_SUGGESTIONS
    .filter((city) =>
      city.toLowerCase() !== normalizedLocationQuery &&
      (!normalizedLocationQuery || city.toLowerCase().includes(normalizedLocationQuery)),
    )
    .slice(0, 6);
  const [hourlyRate, setHourlyRate] = useState('');
  const [savingBookingDetails, setSavingBookingDetails] = useState(false);
  const [bookingDetailsError, setBookingDetailsError] = useState('');
  const [bookingActionError, setBookingActionError] = useState('');
  const [workingBookingId, setWorkingBookingId] = useState('');
  const [awardSession, setAwardSession] = useState(null);
  const [selectedStudentBadgeId, setSelectedStudentBadgeId] = useState('');
  const [studentBadgeNote, setStudentBadgeNote] = useState('');
  const [savingStudentAward, setSavingStudentAward] = useState(false);
  const [studentAwardError, setStudentAwardError] = useState('');
  const [savingAchievementId, setSavingAchievementId] = useState('');
  const [achievementVisibilityError, setAchievementVisibilityError] = useState('');
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const uid = user?.uid;
  useEffect(() => {
    setAchievementModalVisible(false);
  }, [uid]);
  useEffect(() => {
    setLocation(user?.location ?? '');
    setLocationDraft(user?.location ?? '');
    setShowLocationSuggestions(false);
    setHomeAddress(user?.homeAddress ?? '');
    setHomeAddressDraft(user?.homeAddress ?? '');
    setHomeAddressEditorVisible(false);
    setHomeAddressError('');
  }, [uid, user?.location, user?.homeAddress]);
  const isDirectTutorAccount = hasDirectTutorAccountStatus(
    user?.role,
    user?.tutorVerificationStatus,
  );
  const canPerformTutorOperations = canUseTutorOperations(
    user?.role,
    application?.verificationStatus,
  );
  const [leaderboardMode, setLeaderboardMode] = useState('rating');
  const tutorResults = useAsync(
    () => (canPerformTutorOperations ? getTutors() : Promise.resolve([])),
    [canPerformTutorOperations],
  );
  const leaderboards = getTutorLeaderboards([], tutorResults.data ?? []);
  const leaderboardEntries = leaderboardMode === 'rating'
    ? leaderboards.topRatedTutors.slice(0, 5)
    : leaderboards.mostHoursTaught.slice(0, 5);
  const bookingResults = useSubscription(
    (onData, onError) => (
      uid && canPerformTutorOperations
        ? subscribeToTutorBookings(uid, onData, onError)
        : undefined
    ),
    [uid, canPerformTutorOperations],
  );
  const studentAwardResults = useSubscription(
    (onData, onError) => (
      uid && canPerformTutorOperations
        ? subscribeToTutorBadgeAwards(uid, onData, onError)
        : undefined
    ),
    [uid, canPerformTutorOperations],
  );
  const achievementResults = useSubscription(
    (onData, onError) => (
      uid && canPerformTutorOperations
        ? subscribeToTutorAchievements(uid, onData, onError)
        : undefined
    ),
    [uid, canPerformTutorOperations],
  );
  const achievementVisibility = useSubscription(
    (onData, onError) => (
      uid && canPerformTutorOperations
        ? subscribeToTutorAchievementVisibility(uid, onData, onError)
        : undefined
    ),
    [uid, canPerformTutorOperations],
  );
  const pendingRequests = (bookingResults.data ?? []).filter((booking) => booking.status === 'requested');
  const sessions = (bookingResults.data ?? [])
    .filter((booking) =>
      [BOOKING_STATUS.UPCOMING, BOOKING_STATUS.COMPLETED].includes(booking.status),
    )
    .sort((first, second) =>
      `${first.dateKey} ${first.startTime}`.localeCompare(`${second.dateKey} ${second.startTime}`),
    );
  const upcomingSessions = sessions.filter((session) => session.status === BOOKING_STATUS.UPCOMING);
  const completedSessions = sessions.filter((session) => session.status === BOOKING_STATUS.COMPLETED);
  const awardsByBooking = new Map(
    (studentAwardResults.data ?? []).map((award) => [award.bookingId, award]),
  );
  const allAchievements = achievementResults.data ?? [];
  const shownAchievements = allAchievements.filter(
    (record) => achievementVisibility.data?.[record.badgeId] ?? true,
  );
  const displayedAchievements = shownAchievements.slice(0, 3);
  const tutorName = application?.name || user?.name || 'Tutor';
  const tutorType = application?.tutorType
    ?? user?.tutorType
    ?? (user?.role === ROLES.PROFESSIONAL ? TUTOR_TYPES.PROFESSIONAL : null);
  const minimumTutorRate = getMinimumTutorRate(tutorType);
  const tutorCategory = application?.tier
    ?? (tutorType === TUTOR_TYPES.PROFESSIONAL
      ? 'Professional Tutor'
      : tutorType === TUTOR_TYPES.PEER
        ? 'Peer Tutor'
        : 'Category not set');
  const courses = application?.courses ?? [];
  const preferredDays = application?.preferredDays ?? [];
  const preferredTimeSlots = application?.preferredTimeSlots ?? [];
  const verificationStatus = application?.verificationStatus
    ?? (isDirectTutorAccount ? user.tutorVerificationStatus : 'not_submitted');
  const verificationNote = application?.verificationNote ?? user?.tutorVerificationNote;

  const loadApplication = useCallback(async () => {
    if (!uid) {
      setLoadError(new Error('Sign in again to load your tutor profile.'));
      setLoadStatus('error');
      return;
    }
    setLoadStatus('loading');
    setLoadError(null);
    try {
      const tutorApplication = await getTutorApplication(uid);
      setApplication(tutorApplication);
      setHourlyRate(
        Number.isFinite(tutorApplication?.hourlyRate) ? String(tutorApplication.hourlyRate) : '',
      );
      setLoadStatus('ready');
    } catch (error) {
      setLoadError(error);
      setLoadStatus('error');
    }
  }, [uid]);

  useFocusEffect(useCallback(() => {
    loadApplication();
  }, [loadApplication]));

  const switchToStudentProfile = async () => {
    try {
      await setWorkspaceMode('student');
    } catch (error) {
      Alert.alert('Could not switch workspaces', getErrorMessage(error, 'Please try again.'));
    }
  };

  if (loadStatus === 'loading') {
    return (
      <ScreenContainer>
        <LoadingState message="Loading your tutor profile..." />
        {user?.role === ROLES.STUDENT ? (
          <WorkspaceSwitchCard
            accessibilityLabel="Switch to student workspace"
            title="Student workspace"
            description="Return to your student profile and learning tools."
            icon="book-outline"
            onPress={switchToStudentProfile}
          />
        ) : null}
      </ScreenContainer>
    );
  }
  if (loadStatus === 'error') {
    return (
      <ScreenContainer>
        <ErrorState
          title="Tutor profile isn’t available"
          message={getErrorMessage(loadError)}
          onRetry={loadApplication}
        />
        {user?.role === ROLES.STUDENT ? (
          <WorkspaceSwitchCard
            accessibilityLabel="Switch to student workspace"
            title="Student workspace"
            description="Return to your student profile and learning tools."
            icon="book-outline"
            onPress={switchToStudentProfile}
          />
        ) : null}
      </ScreenContainer>
    );
  }

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error));
      setSigningOut(false);
    }
  };

  const saveBookingDetails = async () => {
    if (savingBookingDetails) return;
    setBookingDetailsError('');
    const rateError = getTutorRateError(tutorType, Number(hourlyRate));
    if (rateError) {
      setBookingDetailsError(rateError);
      return;
    }
    setSavingBookingDetails(true);
    try {
      await updateTutorBookingDetails(uid, { hourlyRate: Number(hourlyRate) });
      Alert.alert('Booking rate saved', 'Your session token amount has been saved.');
      await loadApplication();
    } catch (error) {
      setBookingDetailsError(getErrorMessage(error, 'Couldn’t save your booking details.'));
    } finally {
      setSavingBookingDetails(false);
    }
  };

  const saveHomeAddress = async () => {
    if (savingHomeAddress) return;
    const updatedAddress = homeAddressDraft.trim();
    const updatedLocation = locationDraft.trim();
    setSavingHomeAddress(true);
    setHomeAddressError('');
    try {
      await updateProfile({ location: updatedLocation, homeAddress: updatedAddress });
      setLocation(updatedLocation);
      setHomeAddress(updatedAddress);
      setShowLocationSuggestions(false);
      setHomeAddressEditorVisible(false);
    } catch (error) {
      setHomeAddressError(getErrorMessage(error, 'Couldn’t save your address.'));
    } finally {
      setSavingHomeAddress(false);
    }
  };

  const openHomeAddressEditor = () => {
    setLocationDraft(location);
    setHomeAddressDraft(homeAddress);
    setShowLocationSuggestions(false);
    setHomeAddressError('');
    setHomeAddressEditorVisible(true);
  };

  const respondToBooking = async (bookingId, status) => {
    if (workingBookingId) return;
    setWorkingBookingId(bookingId);
    setBookingActionError('');
    try {
      await updateBookingStatus(bookingId, status);
    } catch (error) {
      setBookingActionError(getErrorMessage(error, 'Couldn’t update this booking.'));
    } finally {
      setWorkingBookingId('');
    }
  };

  const openStudentBadgePicker = (session) => {
    setAwardSession(session);
    setSelectedStudentBadgeId('');
    setStudentBadgeNote('');
    setStudentAwardError('');
  };

  const saveStudentBadge = async () => {
    if (!awardSession || !selectedStudentBadgeId || savingStudentAward) return;
    setSavingStudentAward(true);
    setStudentAwardError('');
    try {
      await awardStudentBadge({
        bookingId: awardSession.id,
        badgeId: selectedStudentBadgeId,
        note: studentBadgeNote,
      });
      setAwardSession(null);
      setSelectedStudentBadgeId('');
      setStudentBadgeNote('');
    } catch (error) {
      setStudentAwardError(getErrorMessage(error, 'Could not award this badge.'));
    } finally {
      setSavingStudentAward(false);
    }
  };

  const changeAchievementVisibility = async (badgeId, visible) => {
    if (savingAchievementId) return;
    setSavingAchievementId(badgeId);
    setAchievementVisibilityError('');
    try {
      await setTutorAchievementVisibility(badgeId, visible);
    } catch (error) {
      setAchievementVisibilityError(
        getErrorMessage(error, 'Could not update this achievement.'),
      );
    } finally {
      setSavingAchievementId('');
    }
  };

  const renderAchievement = (record) => {
    const achievement = TUTOR_ACHIEVEMENTS.find((item) => item.id === record.badgeId);
    if (!achievement) return null;
    const visible = achievementVisibility.data?.[record.badgeId] ?? true;
    return (
      <View
        key={record.id}
        style={[
          styles.achievementRow,
          !visible && styles.achievementRowHidden,
        ]}
      >
        <View style={styles.achievementMedal}>
          <View style={styles.achievementRibbonPair}>
            <View style={[styles.achievementRibbon, styles.achievementRibbonLeft]} />
            <View style={[styles.achievementRibbon, styles.achievementRibbonRight]} />
          </View>
          <View style={styles.achievementSeal}>
            <Ionicons name="ribbon" size={23} color="#765013" />
          </View>
        </View>
        <View style={styles.achievementCopy}>
          <View style={styles.achievementHeading}>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <View style={styles.achievementEarnedTag}>
              <Text style={styles.achievementEarnedText}>EARNED</Text>
            </View>
          </View>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          <Text style={styles.achievementCriterion}>{achievement.criterionDescription}</Text>
        </View>
        <View style={styles.achievementToggle}>
          <Text style={styles.achievementToggleLabel}>{visible ? 'Shown' : 'Hidden'}</Text>
          <Switch
            accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${achievement.name} on your private profile`}
            value={visible}
            disabled={Boolean(savingAchievementId)}
            onValueChange={(value) => changeAchievementVisibility(record.badgeId, value)}
          />
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.activeBanner}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Tutor workspace</Text>
        </View>
        {!canPerformTutorOperations && [ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL].includes(user?.role) ? (
          <View style={styles.applicantWallet}>
            <TokenBalanceIndicator
              userId={uid}
              role={user.role}
              onBalancePress={() => navigation.navigate(ROUTES.WALLET)}
            />
          </View>
        ) : null}
        {user?.role === ROLES.STUDENT ? (
          <View style={styles.workspaceActions}>
            <WorkspaceSwitchCard
              accessibilityLabel="Switch to student workspace"
              title="Student workspace"
              description="Return to your student profile and learning tools."
              icon="book-outline"
              onPress={switchToStudentProfile}
            />
            {workspaceModeError ? (
              <Text accessibilityRole="alert" style={styles.formError}>
                Your workspace preference could not be saved or restored on this device. You can still switch while signed in.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{tutorName.charAt(0)}</Text>
              {application?.verificationStatus === 'approved' ? (
                <View style={styles.verified}><Ionicons name="checkmark" size={11} color={colors.white} /></View>
              ) : null}
            </View>
            <View style={styles.identity}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{tutorName}</Text>
                <Badge>{tutorCategory}</Badge>
              </View>
              <Text style={styles.education}>
                {application?.credentials || (isDirectTutorAccount
                  ? 'Tutor account created from direct sign-up.'
                  : 'Add your credentials in your tutor application.')}
              </Text>
            </View>
          </View>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Verification status</Text>
            <Text style={styles.rate}>
              {isDirectTutorAccount && verificationStatus === 'pending'
                ? 'not verified'
                : verificationStatus.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.profileDescription}>
            {verificationStatus === 'approved'
              ? isDirectTutorAccount && !application
                ? 'Your account is verified. Tutor tools remain unavailable until approved tutor profile and course details exist.'
                : `${courses.length} course${courses.length === 1 ? '' : 's'} approved.`
              : verificationStatus === 'pending'
                ? isDirectTutorAccount
                  ? 'Your tutor account is waiting for admin verification. Tutor tools remain unavailable until required tutor profile data is approved.'
                  : 'Your application is waiting for admin review.'
                : verificationStatus === 'rejected'
                  ? verificationNote || (isDirectTutorAccount
                    ? 'Your tutor account was not verified. Contact support for next steps.'
                    : 'Your application needs changes before approval.')
                  : isDirectTutorAccount
                    ? 'Your account is verified. Tutor tools remain unavailable until approved tutor profile and course details exist.'
                    : 'Submit your tutor application and course proof for admin review.'}
          </Text>
          <View style={styles.courseList}>
            {courses.map((course) => (
              <View key={`${course.code}-${course.title}`} style={styles.courseItem}>
                <View style={styles.courseRow}>
                  <Ionicons name="school-outline" size={16} color={colors.secondary} />
                  <Text style={styles.courseText}>{course.code} {course.title}</Text>
                  {course.grade ? <Badge>{course.grade}</Badge> : null}
                </View>
                {tutorType === TUTOR_TYPES.PEER && course.proofName ? (
                  <Text style={styles.proofDetails}>
                    Proof: {course.proofName}{course.proofUrl ? `\n${course.proofUrl}` : ''}
                  </Text>
                ) : null}
              </View>
            ))}
            {courses.length === 0 ? (
              <Text style={styles.courseText}>No courses added yet.</Text>
            ) : null}
          </View>
          {tutorType === TUTOR_TYPES.PROFESSIONAL && application?.applicationProofName ? (
            <View style={styles.proofSummary}>
              <Text style={styles.profileDescription}>
                Application proof: {application.applicationProofName}
              </Text>
              {application.applicationProofUrl ? (
                <Text style={styles.proofDetails}>{application.applicationProofUrl}</Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            style={styles.addCourse}
            onPress={() => openTutorApplication(navigation)}
          >
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={styles.addCourseText}>
              {!application
                ? 'Complete tutor application'
                : 'View application and course details'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.personalInfoCard}>
          <View style={styles.personalInfoHeader}>
            <View style={styles.personalInfoHeadingCopy}>
              <Text style={styles.personalInfoTitle}>Personal information</Text>
              <Text style={styles.personalInfoSubtitle}>Private to you</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit personal information"
              onPress={openHomeAddressEditor}
              style={styles.editAddressButton}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.personalInfoRows}>
            <View style={styles.homeAddressRow}>
              <View style={styles.homeAddressIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.homeAddressCopy}>
                <Text style={styles.homeAddressLabel}>City or area</Text>
                <Text style={styles.homeAddressValue}>
                  {location || 'Not set'}
                </Text>
              </View>
            </View>
            <View style={styles.homeAddressRow}>
              <View style={styles.homeAddressIcon}>
                <Ionicons name="home-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.homeAddressCopy}>
                <Text style={styles.homeAddressLabel}>Home address</Text>
                <Text style={styles.homeAddressValue}>
                  {homeAddress || 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {canPerformTutorOperations ? (
          <>
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <View style={styles.leaderboardHeadingCopy}>
              <Text style={styles.sectionHeading}>Tutor leaderboards</Text>
              <Text style={styles.sectionSubtitle}>
                Top 5 tutors · Ratings need {TOP_RATED_MINIMUM_REVIEWS}+ reviews
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Refresh tutor leaderboards"
              accessibilityRole="button"
              onPress={tutorResults.retry}
              style={styles.leaderboardRefresh}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.leaderboardTabs}>
            {[
              ['rating', 'Top rated', 'star-outline'],
              ['hours', 'Most hours', 'time-outline'],
            ].map(([mode, label, icon]) => {
              const selected = leaderboardMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setLeaderboardMode(mode)}
                  style={[styles.leaderboardTab, selected && styles.leaderboardTabActive]}
                >
                  <Ionicons
                    name={icon}
                    size={15}
                    color={selected ? colors.white : colors.mutedText}
                  />
                  <Text style={[styles.leaderboardTabText, selected && styles.leaderboardTabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {tutorResults.status === 'loading' ? (
            <LoadingState compact message="Loading tutor rankings..." />
          ) : tutorResults.status === 'error' ? (
            <ErrorState
              compact
              title="Tutor rankings aren’t available"
              message={getErrorMessage(tutorResults.error)}
              onRetry={tutorResults.retry}
            />
          ) : leaderboardEntries.length ? (
            leaderboardEntries.map((tutor, index) => (
              <LeaderboardRow
                key={tutor.tutorId}
                tutor={tutor}
                rank={index + 1}
                mode={leaderboardMode}
              />
            ))
          ) : (
            <Text style={styles.leaderboardEmpty}>
              {leaderboardMode === 'rating'
                ? `No tutors have ${TOP_RATED_MINIMUM_REVIEWS} or more reviews yet.`
                : 'Recorded teaching hours will appear here after sessions are completed.'}
            </Text>
          )}
        </View>

        <SectionTitle
          title="Schedule and availability"
          subtitle="Availability submitted with your tutor application"
        />
        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityMeta}>
            Days: {preferredDays.length ? preferredDays.join(' · ') : 'Not set'}
          </Text>
          <Text style={styles.availabilityMeta}>
            Times: {preferredTimeSlots.length ? preferredTimeSlots.join(' · ') : 'Not set'}
          </Text>
        </View>

        {canPerformTutorOperations ? (
          <>
            <SectionTitle
              title="Tutor achievements"
              subtitle="Earned milestones · private to you"
            />
            <View style={styles.achievementCard}>
              <Text style={styles.achievementPrivacy}>
                Milestones use completed sessions and confirmed timer records. Only you can view this list.
              </Text>
              {achievementResults.status === 'loading' || achievementVisibility.status === 'loading' ? (
                <LoadingState compact message="Loading your achievements..." />
              ) : achievementResults.status === 'error' ? (
                <ErrorState
                  compact
                  title="Achievements aren’t available"
                  message={getErrorMessage(achievementResults.error)}
                  onRetry={achievementResults.retry}
                />
              ) : achievementVisibility.status === 'error' ? (
                <ErrorState
                  compact
                  title="Achievement controls aren’t available"
                  message={getErrorMessage(achievementVisibility.error)}
                  onRetry={achievementVisibility.retry}
                />
              ) : allAchievements.length ? (
                <>
                  {displayedAchievements.map(renderAchievement)}
                  {!shownAchievements.length ? (
                    <Text style={styles.achievementPrivacy}>
                      Your earned achievements are hidden. Manage them to show them on your private profile.
                    </Text>
                  ) : null}
                  {allAchievements.length ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Manage all earned achievements"
                      onPress={() => setAchievementModalVisible(true)}
                      style={styles.achievementExpandButton}
                    >
                      <Text style={styles.achievementExpandButtonText}>
                        Manage all achievements ({allAchievements.length})
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <Text style={styles.achievementPrivacy}>
                  Your first completed session will earn your first milestone.
                </Text>
              )}
              {achievementVisibilityError ? (
                <Text accessibilityRole="alert" style={styles.formError}>
                  {achievementVisibilityError}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        <SectionTitle
          title="Session requests"
          subtitle={bookingResults.status === 'ready' ? `${pendingRequests.length} pending` : 'Live requests'}
          action="Requires action"
        />
        {bookingResults.status === 'loading' ? (
          <LoadingState compact message="Loading booking requests..." />
        ) : bookingResults.status === 'error' ? (
          <ErrorState
            compact
            title="Session requests aren’t available"
            message={getErrorMessage(bookingResults.error)}
            onRetry={bookingResults.retry}
          />
        ) : pendingRequests.length ? (
          pendingRequests.map((request) => (
            <View key={request.id}>
              <RequestCard
                request={request}
                working={workingBookingId === request.id}
                onAccept={() => respondToBooking(request.id, BOOKING_STATUS.UPCOMING)}
                onDecline={() => respondToBooking(request.id, BOOKING_STATUS.REJECTED)}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyRequests}>New requests will appear here.</Text>
        )}
        {bookingActionError ? (
          <Text accessibilityRole="alert" style={styles.formError}>{bookingActionError}</Text>
        ) : null}
        {studentAwardResults.status === 'error' ? (
          <ErrorState
            compact
            title="Student badge records aren’t available"
            message={getErrorMessage(studentAwardResults.error)}
            onRetry={studentAwardResults.retry}
          />
        ) : null}

        <SectionTitle
          title="Sessions"
          subtitle={`Upcoming (${upcomingSessions.length}) · Past (${completedSessions.length})`}
        />
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View
              style={[
                styles.sessionAccent,
                {
                  backgroundColor: session.status === BOOKING_STATUS.COMPLETED
                    ? colors.mutedText
                    : colors.secondary,
                },
              ]}
            />
            <View style={styles.sessionCopy}>
              <View style={styles.sessionTop}>
                <Text style={styles.sessionStatus}>
                  {session.status === BOOKING_STATUS.COMPLETED ? 'Completed' : 'Upcoming'}
                </Text>
                <Text style={styles.sessionTime}>
                  {session.dateKey} · {session.startTime} - {session.endTime}
                </Text>
              </View>
              <Text style={styles.sessionName}>{session.studentName || 'Student'}</Text>
              <Text style={styles.sessionMeta}>
                {[session.subject, session.location].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.sessionMeta}>
                {formatTokenUnits(session.tokenAmountUnits)} tokens
                {session.tokenStatus === 'settled'
                  ? ' received'
                  : Number.isSafeInteger(session.tokenDepositUnits)
                    ? session.tokenStatus === 'reserved'
                      ? ` · ${formatTokenUnits(session.tokenDepositUnits)} deposit held; full payment on completion`
                      : ''
                    : session.tokenStatus === 'reserved'
                      ? ' held for this session'
                      : ''}
              </Text>
                    <Text style={styles.sessionMeta}>
                      Scheduled: {session.durationHours}h - Recorded teaching: {formatRecordedDuration(session.accumulatedDurationSeconds)}
                    </Text>
              {session.status === BOOKING_STATUS.COMPLETED &&
              studentAwardResults.status === 'ready' ? (
                awardsByBooking.has(session.id) ? (
                  <Text style={styles.awardSavedText}>
                    Badge given: {STUDENT_BADGE_BY_ID[awardsByBooking.get(session.id).badgeId]?.name ?? 'Student badge'}
                  </Text>
                ) : (
                  <AppButton
                    title="Give the student a badge (optional)"
                    variant="outline"
                    onPress={() => openStudentBadgePicker(session)}
                  />
                )
              ) : null}
            </View>
          </View>
        ))}
        {bookingResults.status === 'ready' && !sessions.length ? (
          <Text style={styles.emptyRequests}>Your upcoming and completed sessions will appear here.</Text>
        ) : null}
          </>
        ) : (
          <View style={styles.applicationAccessCard}>
            <Text style={styles.profileDescription}>
              {isDirectTutorAccount
                ? verificationStatus === 'pending'
                  ? 'Your application is awaiting admin review. You can set or update your booking rate now; tutor tools remain unavailable until approval.'
                  : verificationStatus === 'rejected'
                    ? verificationNote || 'Your tutor account was not verified. Contact support for next steps.'
                    : 'Your account is verified, but tutor actions remain unavailable until an approved tutor profile and application exist.'
                : verificationStatus === 'pending'
                  ? 'Tutor tools will be available after your application is approved.'
                  : verificationStatus === 'rejected'
                    ? 'Update your application for another review. Tutor tools remain unavailable until approval.'
                    : 'Submit an application to begin tutor verification. Tutor tools are available after approval.'}
            </Text>
            {!isDirectTutorAccount ? (
              <AppButton
                title={verificationStatus === 'not_submitted' ? 'Apply to tutor' : 'Open tutor application'}
                variant="secondary"
                onPress={() => openTutorApplication(navigation)}
              />
            ) : null}
          </View>
        )}

        {['pending', 'approved'].includes(verificationStatus) && application ? (
          <View style={styles.paymentSetupCard}>
            <SectionTitle
              title="Booking rate"
              subtitle="Set the token amount students need to book a session."
            />
            <AppInput
              label="Session tokens"
              value={hourlyRate}
              handleChangeText={(value) => {
                setHourlyRate(value);
                setBookingDetailsError(
                  value.trim() ? getTutorRateError(tutorType, Number(value)) : '',
                );
              }}
              placeholder="e.g. 280"
              keyboardType="decimal-pad"
            />
            {minimumTutorRate ? (
              <Text style={styles.availabilityMeta}>
                Minimum rate: {minimumTutorRate} tokens per session.
              </Text>
            ) : null}
            {bookingDetailsError ? (
              <Text accessibilityRole="alert" style={styles.formError}>{bookingDetailsError}</Text>
            ) : null}
            <AppButton
              title="Save details"
              variant="outline"
              onPress={saveBookingDetails}
              loading={savingBookingDetails}
            />
          </View>
        ) : null}

        {signOutError ? (
          <Text accessibilityRole="alert" style={styles.signOutError}>
            {signOutError}
          </Text>
        ) : null}
        <AppButton
          title="Sign out"
          variant="danger"
          onPress={handleSignOut}
          loading={signingOut}
        />
      </ScrollView>
      <Modal
        visible={homeAddressEditorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingHomeAddress) setHomeAddressEditorVisible(false);
        }}
      >
        <View style={styles.addressModalBackdrop}>
          <View style={styles.addressModalCard}>
            <View style={styles.addressModalHeader}>
              <View style={styles.addressModalHeadingCopy}>
                <Text style={styles.addressModalTitle}>Edit personal information</Text>
                <Text style={styles.addressModalSubtitle}>
                  Your city and home address are saved to your private account profile.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close home address editor"
                accessibilityRole="button"
                disabled={savingHomeAddress}
                onPress={() => setHomeAddressEditorVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.addressModalForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AppInput
                label="City or area"
                value={locationDraft}
                handleChangeText={(value) => {
                  setLocationDraft(value);
                  setShowLocationSuggestions(true);
                }}
                placeholder="Choose or type a city or area"
                onFocus={() => setShowLocationSuggestions(true)}
                autoCorrect={false}
                returnKeyType="done"
                editable={!savingHomeAddress}
                rightElement={
                  <Ionicons
                    name={showLocationSuggestions ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.mutedText}
                  />
                }
              />
              {showLocationSuggestions ? (
                <View style={styles.locationSuggestions}>
                  <Text style={styles.locationSuggestionsTitle}>
                    {normalizedLocationQuery ? 'Suggestions' : 'Popular cities'}
                  </Text>
                  {locationSuggestions.length ? locationSuggestions.map((city) => (
                    <Pressable
                      key={city}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${city}`}
                      accessibilityState={{ disabled: savingHomeAddress }}
                      disabled={savingHomeAddress}
                      onPress={() => {
                        setLocationDraft(city);
                        setShowLocationSuggestions(false);
                      }}
                      style={styles.locationSuggestion}
                    >
                      <Ionicons name="location-outline" size={17} color={colors.primary} />
                      <Text style={styles.locationSuggestionText}>{city}</Text>
                    </Pressable>
                  )) : (
                    <Text style={styles.noLocationSuggestions}>
                      No matches. Keep typing to use your own location.
                    </Text>
                  )}
                </View>
              ) : null}
              <AppInput
                label="Home address"
                value={homeAddressDraft}
                handleChangeText={setHomeAddressDraft}
                placeholder="Your home address"
                maxLength={300}
                autoComplete="street-address"
                editable={!savingHomeAddress}
              />
              <Text style={styles.addressPrivacyHint}>
                Your address is not included in your public tutor profile.
              </Text>
              {homeAddressError ? (
                <Text accessibilityRole="alert" style={styles.formError}>
                  {homeAddressError}
                </Text>
              ) : null}
              <View style={styles.addressModalActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingHomeAddress}
                  onPress={() => setHomeAddressEditorVisible(false)}
                  style={styles.addressCancelButton}
                >
                  <Text style={styles.addressCancelText}>Cancel</Text>
                </Pressable>
                <View style={styles.addressSaveButton}>
                  <AppButton
                    title="Save details"
                    onPress={saveHomeAddress}
                    loading={savingHomeAddress}
                    disabled={savingHomeAddress}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={achievementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAchievementModalVisible(false)}
      >
        <View style={styles.badgeModalBackdrop}>
          <View style={styles.badgeModalCard}>
            <View style={styles.badgeModalHeader}>
              <View style={styles.badgeModalCopy}>
                <Text style={styles.badgeModalTitle}>Your tutor achievements</Text>
                <Text style={styles.badgeModalSubtitle}>
                  Manage which earned milestones appear on your private profile.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close achievement manager"
                onPress={() => setAchievementModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allAchievements.map(renderAchievement)}
              {achievementVisibilityError ? (
                <Text accessibilityRole="alert" style={styles.formError}>
                  {achievementVisibilityError}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(awardSession)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingStudentAward) setAwardSession(null);
        }}
      >
        <View style={styles.badgeModalBackdrop}>
          <View style={styles.badgeModalCard}>
            <View style={styles.badgeModalHeader}>
              <View style={styles.badgeModalCopy}>
                <Text style={styles.badgeModalTitle}>Recognize your student</Text>
                <Text style={styles.badgeModalSubtitle}>
                  {awardSession?.studentName || 'Student'} · {awardSession?.subject || 'Completed session'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Skip giving a badge"
                disabled={savingStudentAward}
                onPress={() => setAwardSession(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.badgeModalHint}>
              A badge is optional encouragement, not a grade. Keep notes brief; don’t include grades, chat, or private session details.
            </Text>
            <ScrollView style={styles.badgeChoices} keyboardShouldPersistTaps="handled">
              {STUDENT_BADGES.map((badge) => {
                const selected = selectedStudentBadgeId === badge.id;
                return (
                  <Pressable
                    key={badge.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={savingStudentAward}
                    onPress={() => setSelectedStudentBadgeId(badge.id)}
                    style={[styles.badgeChoice, selected && styles.badgeChoiceSelected]}
                  >
                    <View style={styles.badgeChoiceEmblem}>
                      <Ionicons
                        name="ribbon"
                        size={19}
                        color={selected ? colors.primary : '#9A6A20'}
                      />
                    </View>
                    <View style={styles.badgeChoiceCopy}>
                      <Text style={[styles.badgeChoiceTitle, selected && styles.badgeChoiceSelectedText]}>
                        {badge.name}
                      </Text>
                      <Text style={styles.badgeChoiceDescription}>{badge.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <AppInput
              label="Optional note (280 characters max)"
              value={studentBadgeNote}
              handleChangeText={setStudentBadgeNote}
              placeholder="What did the student do well?"
              maxLength={280}
              multiline
            />
            {studentAwardError ? (
              <Text accessibilityRole="alert" style={styles.formError}>
                {studentAwardError}
              </Text>
            ) : null}
            <AppButton
              title="Confirm and award badge"
              variant="secondary"
              disabled={!selectedStudentBadgeId}
              loading={savingStudentAward}
              onPress={saveStudentBadge}
            />
            <Pressable
              disabled={savingStudentAward}
              onPress={() => setAwardSession(null)}
              style={styles.skipBadgeButton}
            >
              <Text style={styles.skipBadgeText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  signOutError: { color: colors.error, fontSize: 13 },
  paymentSetupCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  formError: { marginBottom: spacing.sm, color: colors.errorText, fontSize: 12, lineHeight: 17 },
  paymentVerificationCard: { gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  emptyRequests: { padding: spacing.md, borderRadius: radius.md, color: colors.mutedText, backgroundColor: colors.surface, fontSize: 12 },
  activeBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E6E8EA' },
  applicantWallet: { alignItems: 'flex-end' },
  activeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6, backgroundColor: colors.secondary },
  activeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  profileCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, shadowColor: colors.black, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  profileRow: { flexDirection: 'row', gap: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  verified: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  identity: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  education: { marginTop: 3, color: colors.mutedText, fontSize: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  ratingValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  ratingMeta: { color: colors.mutedText, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.lavender },
  badgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md },
  rateLabel: { color: colors.mutedText, fontSize: 11, flex: 1 },
  rate: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  rateUnit: { color: colors.mutedText, fontSize: 11 },
  profileDescription: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 11, lineHeight: 16 },
  personalInfoCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  personalInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  personalInfoHeadingCopy: { flex: 1 },
  personalInfoTitle: { color: colors.heading, fontSize: 16, fontWeight: '700' },
  personalInfoSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  editAddressButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.background },
  personalInfoRows: { gap: spacing.sm },
  homeAddressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  homeAddressIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surface },
  homeAddressCopy: { flex: 1 },
  homeAddressLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  homeAddressValue: { marginTop: 3, color: colors.text, fontSize: 13, lineHeight: 18 },
  addressModalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(20, 20, 30, 0.48)' },
  addressModalCard: { maxHeight: '92%', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  addressModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  addressModalHeadingCopy: { flex: 1 },
  addressModalForm: { flexGrow: 0 },
  addressModalTitle: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  addressModalSubtitle: { marginTop: 3, color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  addressPrivacyHint: { marginTop: -spacing.sm, marginBottom: spacing.md, color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  locationSuggestions: { marginTop: -spacing.sm, marginBottom: spacing.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  locationSuggestionsTitle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, color: colors.mutedText, fontSize: 12, fontWeight: '600' },
  locationSuggestion: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  locationSuggestionText: { color: colors.text, fontSize: 14 },
  noLocationSuggestions: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, color: colors.mutedText, fontSize: 13 },
  addressModalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  addressCancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.background },
  addressCancelText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  addressSaveButton: { flex: 1, justifyContent: 'center' },
  leaderboardCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  leaderboardHeadingCopy: { flex: 1 },
  leaderboardRefresh: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.background },
  leaderboardTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  leaderboardTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.background },
  leaderboardTabActive: { backgroundColor: colors.primary },
  leaderboardTabText: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  leaderboardTabTextActive: { color: colors.white },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  leaderboardRank: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.mint },
  leaderboardRankText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  leaderboardIdentity: { flex: 1, marginHorizontal: spacing.sm },
  leaderboardName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  leaderboardDetail: { marginTop: 2, color: colors.mutedText, fontSize: 10 },
  leaderboardScore: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  leaderboardEmpty: { paddingVertical: spacing.md, color: colors.mutedText, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  courseList: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  courseItem: { paddingVertical: 4 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  courseText: { flex: 1, color: colors.text, fontSize: 11 },
  proofSummary: { marginTop: spacing.xs },
  proofDetails: { flexShrink: 1, marginTop: 3, color: colors.mutedText, fontSize: 10, lineHeight: 15 },
  addCourse: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.background },
  addCourseText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  applicationAccessCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeading: { color: colors.heading, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  sectionAction: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  workspaceActions: { gap: spacing.sm },
  availabilityCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  weekRow: { flexDirection: 'row', gap: 5, marginTop: spacing.md },
  day: { flex: 1, alignItems: 'center', padding: 7, borderRadius: 8, backgroundColor: colors.background },
  dayActive: { backgroundColor: '#E2DFFF' },
  dayName: { color: colors.mutedText, fontSize: 10, fontWeight: '700' },
  dayNameActive: { color: colors.primary },
  daySlots: { marginTop: 4, color: colors.mutedText, fontSize: 9 },
  dayDot: { width: 6, height: 6, marginTop: 5, borderRadius: 3, backgroundColor: colors.border },
  dayDotActive: { backgroundColor: colors.primary },
  availabilityMeta: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 10 },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  requestAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  requestInitial: { color: colors.primary, fontWeight: '700' },
  requestCopy: { flex: 1 },
  requestName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  requestMeta: { marginTop: 2, color: colors.mutedText, fontSize: 10 },
  requestNote: { marginTop: 4, color: colors.mutedText, fontSize: 9, fontStyle: 'italic' },
  requestAmount: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  sessionCard: { flexDirection: 'row', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surface },
  sessionAccent: { width: 5 },
  sessionCopy: { flex: 1, padding: spacing.sm },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionStatus: { color: colors.successText, fontSize: 9, fontWeight: '700' },
  sessionTime: { color: colors.mutedText, fontSize: 9 },
  sessionName: { marginTop: 4, color: colors.text, fontSize: 12, fontWeight: '700' },
  sessionMeta: { marginTop: 3, color: colors.mutedText, fontSize: 10 },
  sessionAction: { marginTop: 7, color: colors.primary, fontSize: 10, fontWeight: '700' },
  sessionActionMuted: { color: colors.mutedText, fontWeight: '400' },
  achievementCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  achievementPrivacy: { marginBottom: spacing.sm, color: colors.mutedText, fontSize: 11, lineHeight: 16 },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: '#F0D79C', borderRadius: radius.lg, backgroundColor: '#FFFAED' },
  achievementRowHidden: { backgroundColor: colors.surface, borderColor: colors.border },
  achievementMedal: { width: 48, height: 58, alignItems: 'center', justifyContent: 'center' },
  achievementRibbonPair: { position: 'absolute', top: 34, flexDirection: 'row', gap: 2 },
  achievementRibbon: { width: 11, height: 17, backgroundColor: '#D4952C' },
  achievementRibbonLeft: { transform: [{ rotate: '12deg' }] },
  achievementRibbonRight: { transform: [{ rotate: '-12deg' }] },
  achievementSeal: { width: 39, height: 39, zIndex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#E0A93D', borderRadius: 20, backgroundColor: '#FFF0BD' },
  achievementCopy: { flex: 1 },
  achievementHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  achievementName: { color: colors.heading, fontSize: 13, fontWeight: '700' },
  achievementEarnedTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#F3E1B8' },
  achievementEarnedText: { color: '#765013', fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  achievementExpandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: spacing.sm, paddingVertical: spacing.sm },
  achievementExpandButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  achievementDescription: { marginTop: 3, color: colors.mutedText, fontSize: 11, lineHeight: 16 },
  achievementCriterion: { marginTop: 2, color: colors.primary, fontSize: 10, lineHeight: 14 },
  achievementToggle: { alignItems: 'center' },
  achievementToggleLabel: { color: colors.mutedText, fontSize: 10 },
  awardSavedText: { marginTop: spacing.sm, color: colors.successText, fontSize: 11, fontWeight: '700' },
  badgeModalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(18, 21, 32, 0.55)' },
  badgeModalCard: { maxHeight: '94%', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  badgeModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  badgeModalCopy: { flex: 1 },
  badgeModalTitle: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  badgeModalSubtitle: { marginTop: 3, color: colors.mutedText, fontSize: 11 },
  badgeModalHint: { marginTop: spacing.sm, marginBottom: spacing.sm, color: colors.mutedText, fontSize: 11, lineHeight: 16 },
  badgeChoices: { maxHeight: 280, marginBottom: spacing.sm },
  badgeChoice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  badgeChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.lavender },
  badgeChoiceEmblem: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E0C079', borderRadius: 17, backgroundColor: '#FFF5D9' },
  badgeChoiceCopy: { flex: 1 },
  badgeChoiceTitle: { color: colors.heading, fontSize: 12, fontWeight: '700' },
  badgeChoiceSelectedText: { color: colors.primary },
  badgeChoiceDescription: { marginTop: 2, color: colors.mutedText, fontSize: 10, lineHeight: 14 },
  skipBadgeButton: { alignItems: 'center', paddingVertical: spacing.sm },
  skipBadgeText: { color: colors.mutedText, fontSize: 12, fontWeight: '600' },
});
