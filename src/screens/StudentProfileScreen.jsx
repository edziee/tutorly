import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import ScreenContainer from '../components/ScreenContainer';
import { mockStudentProfile } from '../data/mockStudentProfile';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StudentProfileScreen({
  profileImageUri,
  onProfileImageChange,
}) {
  const [streakRemindersEnabled, setStreakRemindersEnabled] = useState(true);
  const [meetingPreference, setMeetingPreference] = useState('campus');
  const [profile, setProfile] = useState({
    name: mockStudentProfile.name,
    age: mockStudentProfile.age,
    location: mockStudentProfile.location,
    email: mockStudentProfile.email,
    phone: mockStudentProfile.phone,
  });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [editVisible, setEditVisible] = useState(false);
  const showProfileMessage = (message) => Alert.alert('Student Profile', message);
  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onProfileImageChange(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Unable to open photos', 'Please try selecting your profile picture again.');
    }
  };
  const openProfileEditor = () => {
    setProfileDraft(profile);
    setEditVisible(true);
  };
  const saveProfile = () => {
    const updatedProfile = Object.fromEntries(
      Object.entries(profileDraft).map(([field, value]) => [field, value.trim()]),
    );

    if (Object.values(updatedProfile).some((value) => !value)) {
      Alert.alert('Missing information', 'Complete all profile fields before saving.');
      return;
    }

    if (!Number.isInteger(Number(updatedProfile.age)) || Number(updatedProfile.age) < 1) {
      Alert.alert('Invalid age', 'Enter your age as a whole number.');
      return;
    }

    setProfile(updatedProfile);
    setEditVisible(false);
  };

  return (
    <ScreenContainer>
      <>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.profileCard}>
          <View style={styles.avatarFrame}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.profilePhoto} />
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
            onPress={pickProfileImage}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={17} color={colors.primary} />
          </Pressable>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.scholarBadge]}>
              <Ionicons name="ribbon" size={13} color="#754000" />
              <Text style={styles.badgeText}>Honor Scholar</Text>
            </View>
            <View style={[styles.badge, styles.collaboratorBadge]}>
              <Ionicons name="people" size={13} color="#006F69" />
              <Text style={styles.badgeText}>Top Peer Collaborator</Text>
            </View>
          </View>
        </View>

        <View style={styles.personalInfoCard}>
          <View style={styles.personalInfoHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Pressable onPress={openProfileEditor} accessibilityLabel="Edit personal information">
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.personalInfoGrid}>
            <PersonalDetail icon="person-outline" label="Name" value={profile.name} />
            <PersonalDetail icon="calendar-outline" label="Age" value={`${profile.age} years`} />
            <PersonalDetail icon="location-outline" label="Location" value={profile.location} />
            <PersonalDetail icon="mail-outline" label="Email" value={profile.email} />
            <PersonalDetail icon="call-outline" label="Phone" value={profile.phone} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={19} color="#FF9C35" />
            </View>
            <View style={styles.streakTitleGroup}>
              <View style={styles.titleAndTag}>
                <Text style={styles.streakTitle}>{mockStudentProfile.streakDays}-Day Streak</Text>
                <Text style={styles.activeTag}>Active</Text>
              </View>
              <Text style={styles.mutedText}>Next Milestone: {mockStudentProfile.nextStreakMilestone} Days</Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {mockStudentProfile.weeklyActivity.map((isActive, index) => (
              <View key={`${weekdays[index]}-${index}`} style={styles.weekItem}>
                <Text style={[styles.weekday, index === 5 && styles.todayLabel]}>{weekdays[index]}</Text>
                <View style={[styles.dayCircle, isActive ? styles.activeDay : styles.inactiveDay]}>
                  <Ionicons
                    name={isActive ? 'checkmark' : index === 5 ? 'flash' : 'ellipse'}
                    size={isActive ? 16 : 12}
                    color={isActive ? colors.white : index === 5 ? '#006F69' : '#D9DCE3'}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressTitle}>Level {mockStudentProfile.scholarLevel} Scholar Shield</Text>
            <Text style={styles.progressPercent}>{mockStudentProfile.scholarProgress}% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${mockStudentProfile.scholarProgress}%` }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatTile icon="hourglass" label="Hours" value={mockStudentProfile.studyHours} detail="Studied" />
          <StatTile icon="calendar" label="Sessions" value={mockStudentProfile.completedSessions} detail="Completed" />
          <StatTile icon="star" label="Rating" value={mockStudentProfile.rating} detail="Mutual Peer" />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.leaderboardHeader}>
            <View style={styles.sectionHeadingGroup}>
              <View style={styles.headingIcon}>
                <Ionicons name="bar-chart" size={19} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Study Leaderboard</Text>
            </View>
            <Text style={styles.weekTag}>Week 8</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroller}>
            <View style={[styles.courseChip, styles.selectedCourse]}>
              <Text style={styles.selectedCourseText}>CS 240 Algorithms</Text>
            </View>
            <View style={styles.courseChip}>
              <Text style={styles.courseText}>MATH 215 Linear Algebra</Text>
            </View>
            <View style={styles.courseChip}>
              <Text style={styles.courseText}>STAT 350</Text>
            </View>
          </ScrollView>

          <View style={styles.leaderList}>
            {mockStudentProfile.leaderboard.map((leader) => (
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
          </View>

          <Text style={styles.subsectionLabel}>UNLOCKED SUBJECT HONORS</Text>
          <View style={styles.honorsRow}>
            {mockStudentProfile.subjectHonors.map((honor) => (
              <View key={honor.id} style={styles.honorTile}>
                <Ionicons name={honor.icon} size={19} color={colors.primary} />
                <Text numberOfLines={1} style={styles.honorTitle}>{honor.title}</Text>
                <Text style={styles.honorSubject}>{honor.subject}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.headingIconMint}>
              <Ionicons name="navigate" size={19} color="#006F69" />
            </View>
            <Text style={styles.preferenceTitle}>Study Space Preference</Text>
            <Text style={styles.defaultLabel}>Default{ '\n' }Location</Text>
          </View>

          <View style={styles.preferenceRow}>
            <PreferenceOption
              selected={meetingPreference === 'campus'}
              icon="location-outline"
              title={mockStudentProfile.campus}
              description={mockStudentProfile.campusAddress}
              onPress={() => setMeetingPreference('campus')}
            />
            <PreferenceOption
              selected={meetingPreference === 'online'}
              icon="link-outline"
              title="Tutor Custom Meeting Link"
              description="(Zoom, Google Meet, or Teams link provided by tutor in chat/booking)"
              onPress={() => setMeetingPreference('online')}
            />
          </View>

          <Text style={styles.reminderHeading}>AUTOMATED SESSION REMINDERS</Text>
          <View style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>Streak Recovery Notification</Text>
              <Text style={styles.reminderDescription}>Urgent reminder at 8:00 PM if streak is at risk</Text>
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
            <Text style={styles.earnText}>Earn ₱200 - ₱300/hr</Text>
          </View>
          <Ionicons name="school-outline" size={23} color={colors.secondary} style={styles.schoolIcon} />
          <Text style={styles.ctaTitle}>Qualified to Peer Tutor?</Text>
          <AppButton
            title="Check Eligibility  →"
            variant="secondary"
            onPress={() => showProfileMessage('Peer tutor eligibility details are coming soon.')}
          />
        </View>

        <Pressable
          onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive' },
          ])}
          style={styles.logoutButton}
        >
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
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
                <Text style={styles.modalTitle}>Edit Personal Information</Text>
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
                  label="Email"
                  value={profileDraft.email}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, email: value })}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AppInput
                  label="Phone"
                  value={profileDraft.phone}
                  handleChangeText={(value) => setProfileDraft({ ...profileDraft, phone: value })}
                  placeholder="Your contact number"
                  keyboardType="phone-pad"
                />
              </ScrollView>
              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setEditVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={saveProfile}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </>
    </ScreenContainer>
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
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});