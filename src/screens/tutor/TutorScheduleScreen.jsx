import { ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import { BOOKING_STATUS } from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { subscribeToTutorBookings } from '../../services/bookingService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';

const visibleStatuses = [
  BOOKING_STATUS.REQUESTED,
  BOOKING_STATUS.UPCOMING,
  BOOKING_STATUS.COMPLETED,
];

const statusLabels = {
  [BOOKING_STATUS.REQUESTED]: 'Requested',
  [BOOKING_STATUS.UPCOMING]: 'Upcoming',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
};

function formatSessionDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateKey
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function TutorScheduleScreen() {
  const { user } = useAuth();
  const bookings = useSubscription(
    (onData, onError) => (
      user?.uid ? subscribeToTutorBookings(user.uid, onData, onError) : undefined
    ),
    [user?.uid],
  );

  if (!user?.uid) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Sign in to view your schedule"
        message="Your booking requests and sessions will appear here."
      />
    );
  }
  if (bookings.status === 'loading') {
    return <LoadingState message="Loading your sessions..." />;
  }
  if (bookings.status === 'error') {
    return (
      <ErrorState
        title="Could not load your schedule"
        message={getErrorMessage(bookings.error)}
        onRetry={bookings.retry}
      />
    );
  }

  const sessions = (bookings.data ?? [])
    .filter((booking) => visibleStatuses.includes(booking.status))
    .sort((first, second) =>
      `${first.dateKey} ${first.startTime}`.localeCompare(`${second.dateKey} ${second.startTime}`),
    );
  const upcomingCount = sessions.filter(
    (session) => session.status === BOOKING_STATUS.REQUESTED ||
      session.status === BOOKING_STATUS.UPCOMING,
  ).length;
  const completedCount = sessions.filter(
    (session) => session.status === BOOKING_STATUS.COMPLETED,
  ).length;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthRow}>
          <Text style={styles.month}>{formatMonth(new Date())}</Text>
          <Text style={styles.view}>Live agenda</Text>
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>Upcoming {upcomingCount}</Text>
          <Text style={styles.summaryText}>Completed {completedCount}</Text>
        </View>
        <Text style={styles.heading}>Sessions</Text>
        {sessions.map((session) => (
          <View key={session.id} style={styles.session}>
            <View style={styles.sessionTop}>
              <Text style={styles.date}>{formatSessionDate(session.dateKey)}</Text>
              <Text
                style={[
                  styles.status,
                  session.status === BOOKING_STATUS.COMPLETED && styles.completed,
                ]}
              >
                {statusLabels[session.status]}
              </Text>
            </View>
            <Text style={styles.subject}>{session.subject || 'Tutoring session'}</Text>
            <Text style={styles.student}>Student: {session.studentName || 'Student'}</Text>
            <Text style={styles.meta}>{session.startTime} - {session.endTime}</Text>
            <Text style={styles.meta}>{session.location || 'Location not specified'}</Text>
          </View>
        ))}
        {!sessions.length ? (
          <EmptyState
            title="No sessions yet"
            message="Accepted booking requests and completed sessions will appear here."
          />
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  month: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  view: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 12,
    color: colors.primary,
    backgroundColor: colors.lavender,
    fontSize: 10,
    fontWeight: '700',
  },
  summary: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  summaryText: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 14,
    color: colors.mutedText,
    backgroundColor: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  heading: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  session: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  status: { color: colors.successText, fontSize: 10, fontWeight: '700' },
  completed: { color: colors.mutedText },
  subject: { marginTop: spacing.sm, color: colors.heading, fontSize: 15, fontWeight: '700' },
  student: { marginTop: spacing.xs, color: colors.text, fontSize: 12, fontWeight: '600' },
  meta: { marginTop: spacing.xs, color: colors.mutedText, fontSize: 11 },
});
