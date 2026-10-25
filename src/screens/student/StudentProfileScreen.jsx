import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
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
import EmptyState from '../../components/EmptyState';
import WorkspaceSwitchCard from '../../components/WorkspaceSwitchCard';
import { openTutorApplication } from '../../navigation/studentNavigationActions';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatusBadge, { BOOKING_STATUS_BADGE } from '../../components/StatusBadge';
import { ROUTES } from '../../constants/routes';
import {
  groupStudentBadgeAwards,
  STUDENT_BADGE_BY_ID,
} from '../../constants/gamification';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import {
  setStudentBadgeVisibility,
  subscribeToStudentBadgeAwards,
  subscribeToStudentBadgeVisibility,
} from '../../services/badgeService';
import { subscribeToStudentBookings } from '../../services/bookingService';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getNextBooking } from '../../utils/bookings';
import { getAuthErrorMessage, getErrorMessage } from '../../utils/errors';
import { formatDateKey } from '../../utils/format';
import { getFirstName, getUserId } from '../../utils/user';
import { isHttpsUrl } from '../../utils/validation';

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StudentProfileScreen({ navigation }) {
  const { user, signOut, updateProfile, loading, setWorkspaceMode, workspaceModeError } = useAuth();
  const userId = getUserId(user);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [streakRemindersEnabled, setStreakRemindersEnabled] = useState(true);
  const [meetingPreference, setMeetingPreference] = useState('campus');
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    age: user?.age == null ? '' : String(user.age),
    location: user?.location ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    photoUrl: user?.photoUrl ?? '',
  });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [editVisible, setEditVisible] = useState(false);
  useEffect(() => {
    const currentProfile = {
      name: user?.name ?? '',
      age: user?.age == null ? '' : String(user.age),
      location: user?.location ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      photoUrl: user?.photoUrl ?? '',
    };
    setProfile(currentProfile);
    setProfileDraft(currentProfile);
  }, [user?.uid, user?.name, user?.age, user?.location, user?.email, user?.phone, user?.photoUrl]);
  const stats = user?.stats ?? {};
  const streakDays = Number(stats.streakDays) || 0;
  const nextStreakMilestone = Number(stats.nextStreakMilestone) || streakDays + 1;
  const weeklyActivity = Array.isArray(stats.weeklyActivity)
    ? stats.weeklyActivity.slice(0, 7)
    : [];
  const scholarLevel = Number(stats.scholarLevel) || 1;
  const scholarProgress = Math.min(100, Math.max(0, Number(stats.scholarProgress) || 0));
  const leaderboard = Array.isArray(stats.leaderboard) ? stats.leaderboard : [];
  const subjectHonors = Array.isArray(stats.subjectHonors) ? stats.subjectHonors : [];
  const firstName = getFirstName(user);
  const bookings = useSubscription(
    (onData, onError) => (userId
      ? subscribeToStudentBookings(userId, onData, onError)
      : undefined),
    [userId],
  );
  const badgeAwards = useSubscription(
    (onData, onError) => (userId
      ? subscribeToStudentBadgeAwards(userId, onData, onError)
      : undefined),
    [userId],
  );
  const badgeVisibility = useSubscription(
    (onData, onError) => (userId
      ? subscribeToStudentBadgeVisibility(userId, onData, onError)
      : undefined),
    [userId],
  );
  const [savingBadgeId, setSavingBadgeId] = useState('');
  const [badgeVisibilityError, setBadgeVisibilityError] = useState('');
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  useEffect(() => {
    setBadgeModalVisible(false);
  }, [userId]);
  const allBadgeAwards = badgeAwards.data ?? [];
  const groupedBadgeAwards = groupStudentBadgeAwards(
    allBadgeAwards,
    (award) => badgeVisibility.data?.[award.id] ?? true,
  );
  const visibleBadgeGroups = groupedBadgeAwards.filter((group) => group.visibleCount > 0);
  const badgePreviewGroups = visibleBadgeGroups.slice(0, 3);

  const changeBadgeVisibility = async (bookingId, visible) => {
    if (savingBadgeId) return;
    setSavingBadgeId(bookingId);
    setBadgeVisibilityError('');
    try {
      await setStudentBadgeVisibility(bookingId, visible);
    } catch (error) {
      setBadgeVisibilityError(getErrorMessage(error, 'Could not update this badge.'));
    } finally {
      setSavingBadgeId('');
    }
  };
  const renderBadgeAward = (award) => {
    const badge = STUDENT_BADGE_BY_ID[award.badgeId];
    const visible = badgeVisibility.data?.[award.id] ?? true;
    return (
      <View key={award.id} style={styles.badgeAwardRow}>
        <View
          accessible={false}
          style={[styles.badgeMedal, !visible && styles.badgeMedalHidden]}
        >
          <View style={styles.badgeMedalRibbons}>
            <View style={[styles.badgeRibbonTail, styles.badgeRibbonLeft]} />
            <View style={[styles.badgeRibbonTail, styles.badgeRibbonRight]} />
          </View>
          <View style={styles.badgeMedalSeal}>
            <Ionicons
              name="ribbon"
              size={24}
              color={visible ? colors.warningText : colors.mutedText}
            />
          </View>
        </View>
        <View style={styles.badgeAwardCopy}>
          <View style={styles.badgeAwardHeading}>
            <Text style={styles.badgeAwardTitle}>{badge?.name ?? 'Badge'}</Text>
            <View style={styles.badgeAwardTag}>
              <Text style={styles.badgeAwardTagText}>EARNED</Text>
            </View>
          </View>
          <Text style={styles.badgeAwardDescription}>
            {badge?.description ?? 'A tutor recognized your learning.'}
          </Text>
          {award.note ? <Text style={styles.badgeAwardNote}>{award.note}</Text> : null}
        </View>
        <View style={styles.badgeVisibilityControl}>
          <Text style={styles.badgeVisibilityLabel}>{visible ? 'Shown' : 'Hidden'}</Text>
          <Switch
            accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${badge?.name ?? 'badge'} on your private profile`}
            value={visible}
            disabled={Boolean(savingBadgeId)}
            onValueChange={(value) => changeBadgeVisibility(award.id, value)}
          />
        </View>
      </View>
    );
  };
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
  const confirmSignOut = () => {
    if (Platform.OS === 'web') {
      handleSignOut();
      return;
    }
    Alert.alert('Sign out?', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
    ]);
  };
  const openProfileEditor = () => {
    setProfileDraft(profile);
    setEditVisible(true);
  };
  const saveProfile = async () => {
    const updatedProfile = {
      name: profileDraft.name.trim(),
      age: profileDraft.age.trim(),
      location: profileDraft.location.trim(),
      phone: profileDraft.phone.trim(),
      photoUrl: profileDraft.photoUrl.trim(),
    };

    if (!updatedProfile.name) {
      Alert.alert('Name needed', 'Enter your name to save your profile.');
      return;
    }

    if (
      updatedProfile.age &&
      (!Number.isInteger(Number(updatedProfile.age)) || Number(updatedProfile.age) < 1)
    ) {
      Alert.alert('Check your age', 'Enter a whole number above 0, or leave it blank.');
      return;
    }

    if (updatedProfile.photoUrl && !isHttpsUrl(updatedProfile.photoUrl)) {
      Alert.alert('Check the photo link', 'Enter a valid secure image link, or leave it blank.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(updatedProfile);
      setProfile({ ...updatedProfile, email: user?.email ?? '' });
      setEditVisible(false);
    } catch (error) {
      Alert.alert('Couldn’t save your profile', getErrorMessage(error, 'Please try again.'));
    } finally {
      setSavingProfile(false);
    }
  };
  const switchToTutorWorkspace = async () => {
    try {
      await setWorkspaceMode('tutor');
    } catch (error) {
      Alert.alert('Could not switch workspaces', getErrorMessage(error, 'Please try again.'));
    }
  };

  if (loading) return <LoadingState message="Loading your profile..." />;
  if (!user?.uid) {
    return     <ErrorState title="Profile unavailable" message="Sign in again to see your profile." />;
  }

  return (
    <ScreenContainer>
      <>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View>
          <Text accessibilityRole="header" style={styles.greeting}>
            {firstName ? `Hi, ${firstName}` : 'Welcome back'}
          </Text>
          <Text style={styles.greetingSubtitle}>Here’s your study progress and profile.</Text>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.avatarFrame}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.profilePhoto} />
            ) : (
              <>
                <View style={styles.avatarHead} />
                <View style={styles.avatarShoulders} />
              </>
            )}
          </View>
          <Pressable
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            onPress={openProfileEditor}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={17} color={colors.primary} />
          </Pressable>
        </View>

        {workspaceModeError ? (
          <Text accessibilityRole="alert" style={styles.workspaceError}>
            Your workspace preference could not be saved or restored on this device. You can still switch while signed in.
          </Text>
        ) : null}
        <WorkspaceSwitchCard
          accessibilityLabel="Switch to tutor workspace"
          title="Tutor workspace"
          description="Switch modes without changing your student account."
          icon="school-outline"
          onPress={switchToTutorWorkspace}
        />

        <View style={styles.personalInfoCard}>
          <View style={styles.personalInfoHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Pressable onPress={openProfileEditor} accessibilityLabel="Edit personal information">
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.personalInfoGrid}>
            <PersonalDetail icon="person-outline" label="Name" value={profile.name} />
            <PersonalDetail
              icon="calendar-outline"
              label="Age"
              value={profile.age ? `${profile.age} years old` : 'Not set'}
            />
            <PersonalDetail
              icon="location-outline"
              label="Location"
              value={profile.location || 'Not set'}
            />
            <PersonalDetail icon="mail-outline" label="Email" value={profile.email} />
            <PersonalDetail
              icon="call-outline"
              label="Phone"
              value={profile.phone || 'Not set'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Learning badges</Text>
          <Text style={styles.emptyProfileData}>
            Optional recognition from tutors. This area is private to you.
          </Text>
          {badgeAwards.status === 'loading' || badgeVisibility.status === 'loading' ? (
            <LoadingState compact message="Loading your badges..." />
          ) : badgeAwards.status === 'error' ? (
            <ErrorState
              compact
              title="Badges aren’t available"
              message={getErrorMessage(badgeAwards.error)}
              onRetry={badgeAwards.retry}
            />
          ) : badgeVisibility.status === 'error' ? (
            <ErrorState
              compact
              title="Badge controls aren’t available"
              message={getErrorMessage(badgeVisibility.error)}
              onRetry={badgeVisibility.retry}
            />
          ) : allBadgeAwards.length ? (
            <>
              {badgePreviewGroups.length ? (
                badgePreviewGroups.map((group) => {
                  const badge = STUDENT_BADGE_BY_ID[group.badgeId];
                  return (
                    <View key={group.badgeId} style={styles.badgeSummaryRow}>
                      <View style={styles.badgeSummaryMedal}>
                        <Ionicons name="ribbon" size={20} color={colors.warningText} />
                      </View>
                      <Text style={styles.badgeSummaryName}>
                        {badge?.name ?? 'Badge'} <Text style={styles.badgeSummaryCount}>× {group.visibleCount}</Text>
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyProfileData}>
                  Your earned badges are hidden. Manage them to show badges on your private profile.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage all received badges"
                onPress={() => setBadgeModalVisible(true)}
                style={styles.badgeExpandButton}
              >
                <Text style={styles.badgeExpandButtonText}>
                  Manage all badges ({allBadgeAwards.length})
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyProfileData}>
              Badges from completed sessions will appear here.
            </Text>
          )}
          {badgeVisibilityError ? (
            <Text accessibilityRole="alert" style={styles.badgeVisibilityError}>
              {badgeVisibilityError}
            </Text>
          ) : null}
        </View>

        <Modal
          visible={badgeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBadgeModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.badgeListModal}>
              <View style={styles.modalHeading}>
                <View style={styles.badgeModalTitleCopy}>
                  <Text style={styles.modalTitle}>Your learning badges</Text>
                  <Text style={styles.badgeModalSubtitle}>
                    Each award can be shown or hidden separately.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close badge manager"
                  onPress={() => setBadgeModalVisible(false)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={23} color={colors.mutedText} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {allBadgeAwards.map(renderBadgeAward)}
                {badgeVisibilityError ? (
                  <Text accessibilityRole="alert" style={styles.badgeVisibilityError}>
                    {badgeVisibilityError}
                  </Text>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.sectionCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={19} color="#FF9C35" />
            </View>
            <View style={styles.streakTitleGroup}>
              <View style={styles.titleAndTag}>
                <Text style={styles.streakTitle}>{streakDays}-Day Streak</Text>
                {streakDays > 0 ? <Text style={styles.activeTag}>Active</Text> : null}
              </View>
              <Text style={styles.mutedText}>Next milestone: {nextStreakMilestone} days</Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {weekdays.map((day, index) => {
              const isActive = weeklyActivity[index] ?? false;
              return (
              <View key={`${weekdays[index]}-${index}`} style={styles.weekItem}>
                <Text style={[styles.weekday, index === 5 && styles.todayLabel]}>{day}</Text>
                <View style={[styles.dayCircle, isActive ? styles.activeDay : styles.inactiveDay]}>
                  <Ionicons
                    name={isActive ? 'checkmark' : index === 5 ? 'flash' : 'ellipse'}
                    size={isActive ? 16 : 12}
                    color={isActive ? colors.white : index === 5 ? '#006F69' : '#D9DCE3'}
                  />
                </View>
              </View>
              );
            })}
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressTitle}>Level {scholarLevel} learner</Text>
            <Text style={styles.progressPercent}>{scholarProgress}% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${scholarProgress}%` }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatTile icon="hourglass" label="Hours" value={Number(stats.studyHours) || 0} detail="Studied" />
          <StatTile icon="calendar" label="Sessions" value={Number(stats.completedSessions) || 0} detail="Completed" />
          <StatTile icon="star" label="Rating" value={Number(stats.rating) || 0} detail="Peer rating" />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Next session</Text>
          <NextSession
            bookings={userId ? bookings : { status: 'ready', data: [] }}
            onFindTutor={() => navigation.navigate(ROUTES.TUTORS)}
            onOpenSchedule={() => navigation.navigate(ROUTES.SCHEDULE)}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.leaderboardHeader}>
            <View style={styles.sectionHeadingGroup}>
              <View style={styles.headingIcon}>
                <Ionicons name="bar-chart" size={19} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Study Leaderboard</Text>
            </View>
            {stats.leaderboardWeek ? <Text style={styles.weekTag}>{stats.leaderboardWeek}</Text> : null}
          </View>

          <View style={styles.leaderList}>
            {leaderboard.map((leader) => (
              <View key={leader.id} style={[styles.leaderRow, leader.currentUser && styles.currentLeaderRow]}>
                <Text style={[styles.rank, leader.rank === 1 && styles.firstRank]}>
                  {leader.rank === 1 ? '♜' : leader.rank}
                </Text>
                <View style={[styles.leaderAvatar, leader.currentUser && styles.currentAvatar]}>
                  {leader.currentUser ? (
                    <Ionicons name="person" size={23} color={colors.white} />
                  ) : (
                    <Text style={styles.avatarInitial}>{leader.name.charAt(0)}</Text>
                  )}
                </View>
                <View style={styles.leaderDetails}>
                  <Text style={[styles.leaderName, leader.currentUser && styles.currentLeaderName]}>
                    {leader.currentUser ? `${profile.name} (You)` : leader.name}
                  </Text>
                  <Text style={styles.leaderMeta}>{leader.hours} hrs • {leader.streak}-day streak</Text>
                </View>
                <View style={styles.pointsGroup}>
                  <Text style={[styles.points, leader.currentUser && styles.currentLeaderName]}>{leader.points.toLocaleString()} pts</Text>
                  <Text style={styles.leaderMeta}>Rank #{leader.rank}</Text>
                </View>
              </View>
            ))}
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyProfileData}>Your study rank isn’t available yet.</Text>
            ) : null}
          </View>

          <Text style={styles.subsectionLabel}>Subject badges</Text>
          <View style={styles.honorsRow}>
            {subjectHonors.map((honor) => (
              <View key={honor.id} style={styles.honorTile}>
                <Ionicons name={honor.icon} size={19} color={colors.primary} />
                <Text numberOfLines={1} style={styles.honorTitle}>{honor.title}</Text>
                <Text style={styles.honorSubject}>{honor.subject}</Text>
              </View>
            ))}
            {subjectHonors.length === 0 ? (
              <Text style={styles.emptyProfileData}>No subject honors yet.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.headingIconMint}>
              <Ionicons name="navigate" size={19} color="#006F69" />
            </View>
            <Text style={styles.preferenceTitle}>Preferred study location</Text>
            <Text style={styles.defaultLabel}>Default{ '\n' }Location</Text>
          </View>

          <View style={styles.preferenceRow}>
            <PreferenceOption
              selected={meetingPreference === 'campus'}
              icon="location-outline"
              title={user.campus || 'Campus not set'}
              description={user.campusAddress || 'Add your campus details to your profile.'}
              onPress={() => setMeetingPreference('campus')}
            />
            <PreferenceOption
              selected={meetingPreference === 'online'}
              icon="link-outline"
              title="Use your tutor’s meeting link"
              description="Your tutor may share a Zoom, Google Meet, or Teams link."
              onPress={() => setMeetingPreference('online')}
            />
          </View>

          <Text style={styles.reminderHeading}>Session reminders</Text>
          <View style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>Study streak reminder</Text>
              <Text style={styles.reminderDescription}>Reminder at 8:00 PM if your streak is at risk</Text>
            </View>
            <Switch
              value={streakRemindersEnabled}
              onValueChange={setStreakRemindersEnabled}
              trackColor={{ false: '#C9CDD5', true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.tutorCta}>
          <View style={styles.earnTag}>
            <Ionicons name="flash" size={12} color="#006F69" />
            <Text style={styles.earnText}>Teach with Tutorly</Text>
          </View>
          <Ionicons name="school-outline" size={23} color={colors.secondary} style={styles.schoolIcon} />
          <Text style={styles.ctaTitle}>Interested in tutoring?</Text>
          <AppButton
            title="See if you qualify"
            variant="secondary"
            onPress={() => openTutorApplication(navigation)}
          />
        </View>

        {signOutError ? (
          <Text accessibilityRole="alert" style={styles.signOutError}>
            {signOutError}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: signingOut, busy: signingOut }}
          disabled={signingOut}
          onPress={confirmSignOut}
          style={styles.logoutButton}
        >
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Sign out</Text>
          <Ionicons name="chevron-forward" size={19} color={colors.error} />
        </Pressable>
        </ScrollView>

        <Modal
          visible={editVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.editModal}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>Edit your profile</Text>
                <Pressable
                  accessibilityLabel="Close profile editor"
                  onPress={() => setEditVisible(false)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={23} color={colors.mutedText} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <AppInput
                  label="Name"
                  value={profileDraft.name}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, name: value })}
                  placeholder="Your full name"
                  autoCapitalize="words"
                />
                <AppInput
                  label="Age"
                  value={profileDraft.age}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, age: value })}
                  placeholder="Your age"
                  keyboardType="number-pad"
                />
                <AppInput
                  label="Location"
                  value={profileDraft.location}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, location: value })}
                  placeholder="City or area"
                />
                <AppInput
                  label="Phone"
                  value={profileDraft.phone}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, phone: value })}
                  placeholder="Your contact number"
                  keyboardType="phone-pad"
                />
                <AppInput
                  label="Photo URL (optional)"
                  value={profileDraft.photoUrl}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, photoUrl: value })}
                  placeholder="https://example.com/photo.jpg"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.photoUrlHint}>
                  Use an HTTPS image link. Firebase Storage uploads are not used.
                </Text>
              </ScrollView>
              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setEditVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <View style={styles.saveButton}>
                  <AppButton title="Save Changes" onPress={saveProfile} loading={savingProfile} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </>
    </ScreenContainer>
  );
}

function NextSession({ bookings, onFindTutor, onOpenSchedule }) {
  if (bookings.status === 'loading') {
    return <LoadingState compact message="Loading your sessions..." />;
  }
  if (bookings.status === 'error') {
    return (
      <ErrorState
        compact
        title="Sessions aren’t available"
        message={getErrorMessage(bookings.error)}
        onRetry={bookings.retry}
      />
    );
  }

  const next = getNextBooking(bookings.data);
  if (!next) {
    return (
      <EmptyState
        compact
        icon="calendar-outline"
        title="No sessions coming up"
        message="Find a tutor to plan your next session."
        actionLabel="Find a tutor"
        onAction={onFindTutor}
      />
    );
  }

  const badge = BOOKING_STATUS_BADGE[next.status];
  return (
    <View style={styles.nextSession}>
      <View style={styles.nextSessionTop}>
        <Text style={styles.nextSessionTutor}>{next.tutorName ?? 'Your tutor'}</Text>
        {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
      </View>
      {next.subject ? <Text style={styles.nextSessionSubject}>{next.subject}</Text> : null}
      <Text style={styles.nextSessionDetail}>
        {formatDateKey(next.dateKey)}
        {next.startTime ? `, ${next.startTime}` : ''}
        {next.endTime ? ` – ${next.endTime}` : ''}
      </Text>
      {next.location ? <Text style={styles.nextSessionDetail}>{next.location}</Text> : null}
      <AppButton title="View schedule" variant="outline" onPress={onOpenSchedule} />
    </View>
  );
}

function PersonalDetail({ icon, label, value }) {
  return (
    <View style={styles.personalDetail}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <View style={styles.personalDetailCopy}>
        <Text style={styles.personalDetailLabel}>{label}</Text>
        <Text style={styles.personalDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatTile({ icon, label, value, detail }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={14} color={colors.text} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

function PreferenceOption({ selected, icon, title, description, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.preferenceOption, selected && styles.selectedPreference]}>
      <View style={styles.optionTopRow}>
        <Ionicons name={icon} size={17} color={selected ? colors.primary : colors.mutedText} />
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={16}
          color={selected ? colors.primary : '#C9CDD5'}
        />
      </View>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  workspaceError: {
    color: colors.errorText,
    fontSize: 12,
  },
  greeting: {
    color: colors.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSubtitle: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: 14,
  },
  profileCard: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  personalInfoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  personalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  personalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  personalDetail: {
    width: '48%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  personalDetailCopy: { flex: 1, minWidth: 0 },
  personalDetailLabel: { ...typography.caption, fontSize: 10 },
  personalDetailValue: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  avatarFrame: {
    width: '72%',
    aspectRatio: 1,
    backgroundColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  avatarHead: {
    position: 'absolute',
    top: '22%',
    width: '36%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#F7F7F7',
  },
  avatarShoulders: {
    position: 'absolute',
    bottom: '-12%',
    width: '82%',
    height: '46%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: '#F7F7F7',
  },
  editButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
  },
  badges: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  scholarBadge: { backgroundColor: colors.peach },
  collaboratorBadge: { backgroundColor: colors.mint },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '600' },
  sectionCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  badgeAwardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0D79C',
    borderRadius: radius.lg,
    backgroundColor: '#FFFAED',
  },
  badgeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0D79C',
    borderRadius: radius.md,
    backgroundColor: '#FFFAED',
  },
  badgeSummaryMedal: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0A93D',
    borderRadius: 17,
    backgroundColor: '#FFF0BD',
  },
  badgeSummaryName: { flex: 1, color: colors.heading, fontSize: 13, fontWeight: '700' },
  badgeSummaryCount: { color: '#765013', fontWeight: '800' },
  badgeListModal: {
    maxHeight: '88%',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  badgeModalTitleCopy: { flex: 1 },
  badgeModalSubtitle: { marginTop: 3, color: colors.mutedText, fontSize: 11, lineHeight: 15 },
  badgeMedal: { width: 54, height: 62, alignItems: 'center', justifyContent: 'center' },
  badgeMedalHidden: { opacity: 0.55 },
  badgeMedalRibbons: { position: 'absolute', top: 35, flexDirection: 'row', gap: 2 },
  badgeRibbonTail: { width: 13, height: 19, backgroundColor: '#D4952C' },
  badgeRibbonLeft: { transform: [{ rotate: '12deg' }] },
  badgeRibbonRight: { transform: [{ rotate: '-12deg' }] },
  badgeMedalSeal: {
    width: 43,
    height: 43,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E0A93D',
    borderRadius: 22,
    backgroundColor: '#FFF0BD',
    shadowColor: '#8A5A11',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeAwardCopy: { flex: 1 },
  badgeAwardHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  badgeAwardTitle: { color: colors.heading, fontSize: 14, fontWeight: '700' },
  badgeAwardTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#F3E1B8' },
  badgeAwardTagText: { color: '#765013', fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  badgeExpandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: spacing.sm, paddingVertical: spacing.sm },
  badgeExpandButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  badgeAwardDescription: { marginTop: 3, color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  badgeAwardNote: { marginTop: spacing.xs, color: colors.text, fontSize: 12, fontStyle: 'italic' },
  badgeVisibilityControl: { alignItems: 'center' },
  badgeVisibilityLabel: { color: colors.mutedText, fontSize: 10 },
  badgeVisibilityError: { marginTop: spacing.sm, color: colors.errorText, fontSize: 12 },
  emptyProfileData: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 12, lineHeight: 17 },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakIcon: {
    width: 34,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#633100',
  },
  streakTitleGroup: { flex: 1 },
  titleAndTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakTitle: { ...typography.heading, fontSize: 18, color: colors.text },
  activeTag: {
    color: '#754000',
    backgroundColor: colors.peach,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  mutedText: { ...typography.caption, marginTop: 2 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  weekItem: { alignItems: 'center', gap: spacing.xs },
  weekday: { fontSize: 10, color: colors.mutedText, fontWeight: '600' },
  todayLabel: { color: colors.primary },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  activeDay: { backgroundColor: '#37318F' },
  inactiveDay: { backgroundColor: '#E8EAF0' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  progressTitle: { ...typography.caption, fontSize: 11 },
  progressPercent: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E9EBEF', marginTop: spacing.xs },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { ...typography.caption, fontSize: 10 },
  statValue: { color: colors.primary, fontSize: 18, fontWeight: '700', marginTop: 3 },
  statDetail: { color: colors.secondary, fontSize: 10, marginTop: 2 },
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeadingGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...typography.heading, color: colors.text, fontSize: 18 },
  nextSession: { marginTop: spacing.md, gap: spacing.sm },
  nextSessionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  nextSessionTutor: { flex: 1, color: colors.heading, fontSize: 16, fontWeight: '700' },
  nextSessionSubject: { color: colors.text, fontSize: 14 },
  nextSessionDetail: { color: colors.mutedText, fontSize: 13 },
  weekTag: { color: colors.success, backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, fontSize: 10, fontWeight: '700' },
  courseScroller: { marginTop: spacing.md, marginBottom: spacing.md, flexGrow: 0 },
  courseChip: { paddingHorizontal: spacing.md, paddingVertical: 7, marginRight: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.inputBackground },
  selectedCourse: { backgroundColor: '#37318F' },
  selectedCourseText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  courseText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  leaderList: { gap: spacing.sm },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.inputBackground, minHeight: 58 },
  currentLeaderRow: { backgroundColor: '#F2F0FF' },
  rank: { width: 24, textAlign: 'center', color: colors.text, fontSize: 14, fontWeight: '700' },
  firstRank: { color: '#754000', fontSize: 17 },
  leaderAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A9C8C3', alignItems: 'center', justifyContent: 'center' },
  currentAvatar: { backgroundColor: '#C7C7C7' },
  avatarInitial: { color: colors.white, fontWeight: '700' },
  leaderDetails: { flex: 1, minWidth: 0 },
  leaderName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  currentLeaderName: { color: colors.primary, fontWeight: '700' },
  leaderMeta: { ...typography.caption, fontSize: 10, marginTop: 2 },
  pointsGroup: { alignItems: 'flex-end', maxWidth: 74 },
  points: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  subsectionLabel: { ...typography.caption, marginTop: spacing.lg, marginBottom: spacing.sm, fontSize: 10 },
  honorsRow: { flexDirection: 'row', gap: spacing.sm },
  honorTile: { flex: 1, minWidth: 0, height: 64, borderRadius: radius.md, backgroundColor: colors.inputBackground, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, gap: 2 },
  honorTitle: { color: colors.text, fontSize: 10, fontWeight: '600' },
  honorSubject: { color: colors.secondary, fontSize: 10, fontWeight: '600' },
  preferenceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  headingIconMint: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: '#8AF0DF', alignItems: 'center', justifyContent: 'center' },
  preferenceTitle: { ...typography.heading, color: colors.text, fontSize: 17, flex: 1 },
  defaultLabel: { ...typography.caption, fontSize: 10, lineHeight: 13 },
  preferenceRow: { flexDirection: 'row', gap: spacing.sm },
  preferenceOption: { flex: 1, minWidth: 0, minHeight: 142, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.inputBackground },
  selectedPreference: { backgroundColor: '#F0EEFF' },
  optionTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  optionTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  optionDescription: { ...typography.caption, fontSize: 11, marginTop: 4, lineHeight: 15 },
  reminderHeading: { ...typography.caption, fontSize: 10, marginTop: spacing.lg, marginBottom: spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.inputBackground },
  reminderCopy: { flex: 1 },
  reminderTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  reminderDescription: { ...typography.caption, fontSize: 11, lineHeight: 15 },
  tutorCta: { position: 'relative', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primary },
  earnTag: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4, borderRadius: radius.pill, backgroundColor: '#8AF0DF', paddingHorizontal: spacing.sm, paddingVertical: 4 },
  earnText: { color: '#006F69', fontSize: 10, fontWeight: '700' },
  schoolIcon: { position: 'absolute', right: spacing.lg, top: spacing.lg },
  ctaTitle: { ...typography.heading, color: colors.white, fontSize: 18, marginVertical: spacing.md },
  logoutButton: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  signOutError: { marginBottom: spacing.sm, color: colors.error, fontSize: 13 },
  logoutIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: colors.error, fontSize: 14, fontWeight: '700', flex: 1 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(20, 20, 30, 0.48)',
  },
  editModal: {
    maxHeight: '92%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  modalHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.heading, color: colors.text, fontSize: 18 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
  },
  cancelButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  saveButton: {
    flex: 1,
    justifyContent: 'center',
  },
  photoUrlHint: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    color: colors.mutedText,
    fontSize: 12,
  },
});