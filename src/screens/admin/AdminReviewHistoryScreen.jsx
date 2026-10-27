import { useSubscription } from '../../hooks/useSubscription';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import VerificationBadge from '../../components/VerificationBadge';
import { VERIFICATION_STATUS } from '../../constants/statuses';
import { subscribeToReviewedApplications } from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';

function formatReviewDate(timestamp) {
  const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : null;
  return date ? date.toLocaleDateString() : 'Date unavailable';
}

function ReviewCard({ application }) {
  const approved = application.verificationStatus === VERIFICATION_STATUS.APPROVED;
  const course = application.courses?.[0];
  const courseLabel = course
    ? [course.code, course.title].filter(Boolean).join(' · ')
    : application.subject || 'No course listed';

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons
          name={approved ? 'checkmark' : 'close'}
          size={18}
          color={approved ? colors.successText : colors.errorText}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{application.name || 'No name'}</Text>
        <Text style={styles.detail}>
          {application.tier || application.tutorType || 'Tutor'} · {courseLabel}
        </Text>
        {!approved && application.verificationNote ? (
          <Text style={styles.note}>{application.verificationNote}</Text>
        ) : null}
      </View>
      <View style={styles.reviewStatus}>
        <VerificationBadge status={application.verificationStatus} align="end" />
        <Text style={styles.date}>
          {formatReviewDate(application.verificationReviewedAt ?? application.updatedAt)}
        </Text>
      </View>
    </View>
  );
}

export default function AdminReviewHistoryScreen() {
  const { status, data, error, retry } = useSubscription(
    (onData, onError) => subscribeToReviewedApplications(onData, onError),
    [],
  );

  if (status === 'loading') return <LoadingState message="Loading review history..." />;
  if (status === 'error') {
    return (
      <ErrorState
        title="Review history isn’t available"
        message={getErrorMessage(error)}
        onRetry={retry}
      />
    );
  }

  const applications = Array.isArray(data) ? data : [];

  return (
    <ScreenContainer>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Review history</Text>
            <Text style={styles.helper}>Tutor applications you’ve reviewed.</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No reviews yet"
            message="Applications you review will appear here."
          />
        }
        renderItem={({ item }) => <ReviewCard application={item} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  heading: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  helper: { marginTop: 4, marginBottom: spacing.lg, color: colors.mutedText, fontSize: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  copy: { flex: 1 },
  name: { color: colors.heading, fontSize: 13, fontWeight: '700' },
  detail: { marginTop: 3, color: colors.mutedText, fontSize: 11 },
  note: { marginTop: 3, color: colors.errorText, fontSize: 10 },
  reviewStatus: { alignItems: 'flex-end' },
  date: { marginTop: 3, color: colors.mutedText, fontSize: 10, textAlign: 'right' },
});
