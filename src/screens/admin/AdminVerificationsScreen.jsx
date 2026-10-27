// Tutors and professional tutors waiting for review. The admin opens the proof
// documents and approves or rejects each one.
// Layout: Member 3.   Data: Member 4 (adminService.subscribeToPendingVerifications
// and adminService.setVerificationStatus, Week 2). Notifying the tutor of the
// result is a Week 3 task for Member 4.
//
// The list is live: once a tutor is approved or rejected they leave the pending
// list by themselves, so this screen does not remove anything. Each item is
// expected to look like the `tutors` document in docs/FIRESTORE_SCHEMA.md with
// its id as `id`: { id, name, tier, subject, courses: [{ code, title, grade }] }.
//
// Rejecting asks for a reason first, because the tutor is told why. Approving
// calls setVerificationStatus(id, 'approved', { reviewerId }).
//
import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { VERIFICATION_STATUS } from '../../constants/statuses';
import { useSubscription } from '../../hooks/useSubscription';
import {
  migrateLegacyApprovedTutors,
  setVerificationStatus,
  subscribeToPendingVerifications,
} from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getErrorMessage } from '../../utils/errors';
import { isGoogleDriveUrl, validateRequired } from '../../utils/validation';
import { getUserId } from '../../utils/user';

export default function AdminVerificationsScreen() {
  const { user } = useAuth();
  const reviewerId = getUserId(user);

  const { status, data, error, retry } = useSubscription(
    (onData) => subscribeToPendingVerifications(onData),
    [],
  );

  // Which tutor is being saved right now, and which one has the reject box open.
  const [busyId, setBusyId] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  const migrateApprovedTutors = async () => {
    if (migrating) return;
    setMigrating(true);
    setMigrationMessage('');
    try {
      const { migrated, locationsUpdated, locationsUnavailable } =
        await migrateLegacyApprovedTutors();
      setMigrationMessage(
        `Updated ${migrated} approved profile${migrated === 1 ? '' : 's'}; ` +
          `${locationsUpdated} city/area location${locationsUpdated === 1 ? '' : 's'} ready.` +
          (locationsUnavailable
            ? ` ${locationsUnavailable} location${locationsUnavailable === 1 ? '' : 's'} could not be geocoded; run this on iOS/Android and check the tutor’s city/area.`
            : ''),
      );
    } catch (error) {
      Alert.alert(
        'Couldn’t finish the update',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setMigrating(false);
    }
  };

  const review = async (tutorId, newStatus, reason) => {
    if (!reviewerId) {
      Alert.alert('Sign in required', 'Sign in as an admin to review tutors.');
      return false;
    }
    setBusyId(tutorId);
    try {
      await setVerificationStatus(tutorId, newStatus, { reviewerId, reason });
      return true;
    } catch (failure) {
      Alert.alert('Couldn’t save changes', getErrorMessage(failure, 'Please try again.'));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  if (status === 'loading') return <LoadingState message="Loading verifications..." />;
  if (status === 'error') {
    return (
      <ErrorState
        title="Verifications aren’t available"
        message={getErrorMessage(error)}
        onRetry={retry}
      />
    );
  }

  const pending = Array.isArray(data) ? data : [];

  return (
    <ScreenContainer>
      <View style={styles.migration}>
        <Text style={styles.migrationTitle}>Approved tutors</Text>
        <Text style={styles.migrationDescription}>
          Update older tutor records, remove legacy exact coordinates, and create approximate map locations from each tutor’s saved city/area. No home addresses are used.
        </Text>
        <AppButton
          title="Update approved tutor records"
          variant="outline"
          loading={migrating}
          disabled={migrating}
          onPress={migrateApprovedTutors}
        />
        {migrationMessage ? (
          <Text accessibilityRole="alert" style={styles.migrationMessage}>
            {migrationMessage}
          </Text>
        ) : null}
      </View>
      {pending.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Nothing to review"
          message="Tutor applications awaiting review will appear here."
        />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item, index) => String(item.id ?? index)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PendingCard
              tutor={item}
              busy={busyId === item.id}
              disabled={busyId !== null || migrating}
              onApprove={() => review(item.id, VERIFICATION_STATUS.APPROVED)}
              onReject={(reason) => review(item.id, VERIFICATION_STATUS.REJECTED, reason)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

function PendingCard({ tutor, busy, disabled, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [openingEvidence, setOpeningEvidence] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const courses = Array.isArray(tutor.courses) ? tutor.courses : [];

  const openEvidence = async (key, url) => {
    if (!isGoogleDriveUrl(url) || openingEvidence) return;
    setOpeningEvidence(key);
    try {
      await Linking.openURL(url.trim());
    } catch (error) {
      Alert.alert('Couldn’t open verification link', getErrorMessage(error, 'Please try again.'));
    } finally {
      setOpeningEvidence(null);
    }
  };

  const confirmReject = async () => {
    const problem = validateRequired(reason, 'A reason');
    setReasonError(problem);
    if (problem) return;
    // If saving fails the box stays open, so the typed reason is not lost.
    await onReject(reason.trim());
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.name}>
            {tutor.name || 'No name'}
          </Text>
          {tutor.subject ? (
            <Text numberOfLines={1} style={styles.subject}>
              {tutor.subject}
            </Text>
          ) : null}
        </View>
        {tutor.tier ? (
          <StatusBadge label={tutor.tier} tone="info" />
        ) : null}
      </View>

      {courses.length > 0 ? (
        <View style={styles.courses}>
          <Text style={styles.coursesLabel}>Courses submitted</Text>
          {courses.map((course, index) => (
            <View key={course.id || `${course.code}-${index}`} style={styles.courseBlock}>
              <Text style={styles.course}>
                {[course.code, course.title].filter(Boolean).join(' · ')}
                {course.grade ? `  (grade ${course.grade})` : ''}
              </Text>
              {course.proofName ? (
                <Text style={styles.evidenceName}>{course.proofName}</Text>
              ) : null}
              {isGoogleDriveUrl(course.proofUrl) ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${course.proofName || 'verification proof'} for ${course.code || 'this course'}`}
                  disabled={openingEvidence !== null}
                  onPress={() => openEvidence(`course-${index}`, course.proofUrl)}
                  style={styles.evidenceLink}
                >
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={styles.evidenceLinkText}>
                    {openingEvidence === `course-${index}` ? 'Opening proof…' : 'Open course proof'}
                  </Text>
                </Pressable>
              ) : tutor.tutorType === 'peer' ? (
                <Text style={styles.missingEvidence}>No valid Drive link submitted.</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noCourses}>No courses added.</Text>
      )}

      {tutor.applicationProofName || tutor.applicationProofUrl ? (
        <View style={styles.applicationEvidence}>
          <Text style={styles.coursesLabel}>Application proof</Text>
          {tutor.applicationProofName ? (
            <Text style={styles.course}>{tutor.applicationProofName}</Text>
          ) : null}
          {isGoogleDriveUrl(tutor.applicationProofUrl) ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${tutor.applicationProofName || 'application verification proof'}`}
              disabled={openingEvidence !== null}
              onPress={() => openEvidence('application', tutor.applicationProofUrl)}
              style={styles.evidenceLink}
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.evidenceLinkText}>
                {openingEvidence === 'application' ? 'Opening proof…' : 'Open application proof'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.missingEvidence}>No valid Drive link submitted.</Text>
          )}
        </View>
      ) : null}

      {rejecting ? (
        <View style={styles.rejectBox}>
          <AppInput
            label="Reason for rejection"
            value={reason}
            handleChangeText={(text) => {
              setReason(text);
              if (reasonError) setReasonError('');
            }}
            placeholder="Let the tutor know what to update"
            error={reasonError}
            multiline
          />
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                title="Cancel"
                variant="outline"
                disabled={disabled}
                onPress={() => {
                  setRejecting(false);
                  setReason('');
                  setReasonError('');
                }}
              />
            </View>
            <View style={styles.action}>
              <AppButton
                title="Confirm rejection"
                variant="danger"
                loading={busy}
                disabled={disabled}
                onPress={confirmReject}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <View style={styles.action}>
            <AppButton
              title="Reject"
              variant="outline"
              disabled={disabled}
              onPress={() => setRejecting(true)}
            />
          </View>
          <View style={styles.action}>
            <AppButton
              title="Approve"
              variant="success"
              leftIcon="checkmark-circle"
              loading={busy}
              disabled={disabled}
              onPress={onApprove}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  migration: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  migrationTitle: {
    ...typography.sectionTitle,
  },
  migrationDescription: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    ...typography.bodySmall,
  },
  migrationMessage: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 12,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    ...typography.sectionTitle,
  },
  subject: {
    marginTop: 2,
    ...typography.bodySmall,
  },
  courses: {
    marginTop: spacing.md,
  },
  coursesLabel: {
    marginBottom: spacing.xs,
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  course: {
    ...typography.bodySmall,
    color: colors.text,
  },
  courseBlock: {
    marginTop: spacing.xs,
  },
  evidenceName: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: 12,
  },
  evidenceLink: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  evidenceLinkText: {
    color: colors.primary,
    ...typography.label,
    textDecorationLine: 'underline',
  },
  missingEvidence: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: 12,
  },
  applicationEvidence: {
    marginTop: spacing.md,
  },
  noCourses: {
    marginTop: spacing.md,
    color: colors.mutedText,
    fontSize: 13,
  },
  rejectBox: {
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
});
