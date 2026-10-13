// Student home screen: greeting, study streak, quick stats, the next session and
// a shortcut to apply as a tutor. The Figma "Profile/Dashboard" frames come in a
// new-user and a returning-user version, and this screen follows both: with no
// streak yet it shows "Start Your Streak".
// Layout: Member 3.   Data: Member 2.
// Plan tasks: "Build the UI for login and sign-up, the student dashboard and
// the tutors list" (Member 3, Week 1) and "Connect the student dashboard and
// tutors list to Firestore" (Member 2, Week 2).
//
// Data it reads, with no mock data:
//   useAuth().user.stats  { streakDays, weeklyActivity (7 true/false), scholarLevel,
//                           scholarProgress (0-100), studyHours, completedSessions, rating }
//                         missing numbers show as 0 (see "stats" in docs/FIRESTORE_SCHEMA.md)
//   bookingService.subscribeToStudentBookings(studentId, callback)
//
// The leaderboard, subject honors and study-space settings from the same Figma
// frame stay on the Profile tab (StudentProfileScreen), so they are not
// repeated here.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatCard from '../../components/StatCard';
import StatusBadge, { BOOKING_STATUS_BADGE } from '../../components/StatusBadge';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { subscribeToStudentBookings } from '../../services/bookingService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getNextBooking } from '../../utils/bookings';
import { getErrorMessage } from '../../utils/errors';
import { formatDateKey } from '../../utils/format';
import { getFirstName, getUserId } from '../../utils/user';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StudentDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const stats = user?.stats ?? {};

  const bookings = useSubscription(
    (onData) => (userId ? subscribeToStudentBookings(userId, onData) : undefined),
    [userId],
  );

  const firstName = getFirstName(user);
  const streakDays = Number(stats.streakDays) || 0;
  const level = Number(stats.scholarLevel) || 1;
  const progress = Math.min(100, Math.max(0, Number(stats.scholarProgress) || 0));
  const weeklyActivity = Array.isArray(stats.weeklyActivity) ? stats.weeklyActivity : [];
  const rating = Number(stats.rating) || 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text accessibilityRole="header" style={styles.greeting}>
            {firstName ? `Hi, ${firstName}` : 'Welcome back'}
          </Text>
          <Text style={styles.greetingSubtitle}>Here is how your studying is going.</Text>
        </View>

        <Card style={styles.cardGap}>
          <View style={styles.streakHeader}>
            <View style={[styles.streakIcon, streakDays > 0 && styles.streakIconActive]}>
              <Ionicons
                name="flame"
                size={20}
                color={streakDays > 0 ? colors.warning : colors.inverseText}
              />
            </View>
            <View style={styles.streakText}>
              <View style={styles.streakTitleRow}>
                <Text style={styles.cardTitle}>
                  {streakDays > 0 ? `${streakDays}-Day Streak` : 'Start Your Streak'}
                </Text>
                {streakDays > 0 ? <StatusBadge label="Active" tone="warning" /> : null}
              </View>
              <Text style={styles.cardCaption}>
                {streakDays > 0
                  ? `Next Milestone: ${streakDays + 1} Days`
                  : 'First Milestone: 1 Day'}
              </Text>
            </View>
          </View>

          <View
            accessibilityLabel={`${weeklyActivity.filter(Boolean).length} of 7 days studied this week`}
            style={styles.weekRow}
          >
            {WEEKDAYS.map((day, index) => {
              const done = weeklyActivity[index] === true;
              return (
                <View key={index} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{day}</Text>
                  <View style={[styles.weekDot, done && styles.weekDotDone]}>
                    {done ? (
                      <Ionicons name="checkmark" size={14} color={colors.inverseText} />
                    ) : (
                      <View style={styles.weekDotEmpty} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>
                {level > 1 ? `Level ${level} Scholar Shield` : 'Level 1 Beginner'}
              </Text>
              <Text style={styles.levelPercent}>{progress}% Complete</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </Card>

        <View style={[styles.statRow, styles.cardGap]}>
          <StatCard
            icon="time-outline"
            label="Hours"
            value={String(Number(stats.studyHours) || 0)}
            caption="Studied"
          />
          <StatCard
            icon="checkmark-done-outline"
            label="Sessions"
            value={String(Number(stats.completedSessions) || 0)}
            caption="Completed"
          />
          <StatCard
            icon="star-outline"
            label="Rating"
            value={rating > 0 ? rating.toFixed(2) : '0'}
            caption="Mutual Peer"
          />
        </View>

        <Card style={styles.cardGap}>
          <Text style={styles.cardTitle}>Next session</Text>
          <NextSession
            bookings={userId ? bookings : { status: 'ready', data: [] }}
            onFindTutor={() => navigation.navigate(ROUTES.TUTORS)}
            onOpenSchedule={() => navigation.navigate(ROUTES.SCHEDULE)}
          />
        </Card>

        <View style={[styles.tutorBanner, styles.cardGap]}>
          <Text style={styles.bannerTitle}>Qualified to Peer Tutor?</Text>
          <Text style={styles.bannerText}>
            Share what you know and help other students on campus.
          </Text>
          <View style={styles.bannerAction}>
            <AppButton
              title="Check Eligibility"
              variant="secondary"
              onPress={() => navigation.navigate(ROUTES.TUTOR_PROFILE)}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// The body of the "Next session" card: loading, error, nothing booked, or the session.
function NextSession({ bookings, onFindTutor, onOpenSchedule }) {
  if (bookings.status === 'loading') {
    return <LoadingState compact message="Loading your sessions..." />;
  }

  if (bookings.status === 'error') {
    return (
      <ErrorState
        compact
        title="Could not load your sessions"
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
        message="Find a tutor and book your next session."
        actionLabel="Find a tutor"
        onAction={onFindTutor}
      />
    );
  }

  const badge = BOOKING_STATUS_BADGE[next.status];
  return (
    <View style={styles.session}>
      <View style={styles.sessionTop}>
        <Text style={styles.sessionTutor}>{next.tutorName ?? 'Your tutor'}</Text>
        {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
      </View>
      {next.subject ? <Text style={styles.sessionSubject}>{next.subject}</Text> : null}
      <View style={styles.sessionDetail}>
        <Ionicons name="calendar-outline" size={15} color={colors.mutedText} />
        <Text style={styles.sessionDetailText}>
          {formatDateKey(next.dateKey)}
          {next.startTime ? `, ${next.startTime}` : ''}
          {next.endTime ? ` – ${next.endTime}` : ''}
        </Text>
      </View>
      {next.location ? (
        <View style={styles.sessionDetail}>
          <Ionicons name="location-outline" size={15} color={colors.mutedText} />
          <Text style={styles.sessionDetailText}>{next.location}</Text>
        </View>
      ) : null}
      <View style={styles.sessionAction}>
        <AppButton title="View schedule" variant="outline" onPress={onOpenSchedule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
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
  cardGap: {
    marginTop: spacing.lg,
  },
  cardTitle: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  cardCaption: {
    color: colors.mutedText,
    fontSize: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mutedText,
  },
  streakIconActive: {
    backgroundColor: colors.warningText,
  },
  streakText: {
    flex: 1,
    gap: 2,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md + 2,
    backgroundColor: colors.inputBackground,
  },
  weekDay: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekDayLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
  },
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.divider,
  },
  weekDotDone: {
    backgroundColor: colors.primary,
  },
  weekDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  levelText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
  },
  levelPercent: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  session: {
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionTutor: {
    flex: 1,
    color: colors.heading,
    fontSize: 16,
    fontWeight: '700',
  },
  sessionSubject: {
    color: colors.text,
    fontSize: 14,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  sessionDetailText: {
    flex: 1,
    color: colors.mutedText,
    fontSize: 13,
  },
  sessionAction: {
    marginTop: spacing.sm,
  },
  tutorBanner: {
    padding: spacing.lg + 4,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.primary,
  },
  bannerTitle: {
    color: colors.inverseText,
    fontSize: 18,
    fontWeight: '700',
  },
  bannerText: {
    marginTop: spacing.xs,
    color: colors.lavender,
    fontSize: 13,
  },
  bannerAction: {
    marginTop: spacing.md,
  },
});
