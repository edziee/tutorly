import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import WorkspaceSwitchCard from '../../components/WorkspaceSwitchCard';
import { openTutorApplication } from '../../navigation/studentNavigationActions';
import { ROLES } from '../../constants/roles';
import {
  BOOKING_PAYMENT_STATUS,
  BOOKING_STATUS,
  TUTOR_TYPES,
} from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import {
  getTutorApplication,
  updateTutorBookingDetails,
} from '../../services/tutorService';
import {
  confirmBookingPayment,
  subscribeToTutorBookings,
  updateBookingStatus,
} from '../../services/bookingService';
import { getAuthErrorMessage, getErrorMessage } from '../../utils/errors';
import { canUseTutorOperations } from '../../utils/workspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

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
  return (
    <View>
      <View style={styles.requestCard}>
        <View style={styles.requestAvatar}><Text style={styles.requestInitial}>{(request.studentName || 'S').charAt(0)}</Text></View>
        <View style={styles.requestCopy}>
          <Text style={styles.requestName}>{request.studentName || 'Student'}</Text>
          <Text style={styles.requestMeta}>{request.subject} · {request.dateKey} · {request.startTime}</Text>
          {request.notes ? <Text style={styles.requestNote}>{request.notes}</Text> : null}
        </View>
        <Text style={styles.requestAmount}>₱{Number(request.totalAmount || 0).toFixed(2)}</Text>
      </View>
      <View style={styles.requestActions}>
        <AppButton title="Accept" variant="secondary" onPress={onAccept} loading={working} />
        <AppButton title="Decline" variant="outline" onPress={onDecline} disabled={working} />
      </View>
    </View>
  );
}

export default function TutorWorkspaceProfileScreen({ navigation }) {
  const { user, signOut, setWorkspaceMode, workspaceModeError } = useAuth();
  const [instantHelp, setInstantHelp] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [application, setApplication] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [savingBookingDetails, setSavingBookingDetails] = useState(false);
  const [bookingDetailsError, setBookingDetailsError] = useState('');
  const [bookingActionError, setBookingActionError] = useState('');
  const [workingBookingId, setWorkingBookingId] = useState('');
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const uid = user?.uid;
  const canPerformTutorOperations = canUseTutorOperations(
    user?.role,
    application?.verificationStatus,
  );
  const bookingResults = useSubscription(
    (onData, onError) => (
      uid && canPerformTutorOperations
        ? subscribeToTutorBookings(uid, onData, onError)
        : undefined
    ),
    [uid, canPerformTutorOperations],
  );
  const pendingRequests = (bookingResults.data ?? []).filter((booking) => booking.status === 'requested');
  const paymentsToVerify = (bookingResults.data ?? []).filter(
    (booking) =>
      [BOOKING_STATUS.UPCOMING, BOOKING_STATUS.COMPLETED].includes(booking.status) &&
      booking.paymentStatus === BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION,
  );
  const sessions = (bookingResults.data ?? [])
    .filter((booking) =>
      [BOOKING_STATUS.UPCOMING, BOOKING_STATUS.COMPLETED].includes(booking.status),
    )
    .sort((first, second) =>
      `${first.dateKey} ${first.startTime}`.localeCompare(`${second.dateKey} ${second.startTime}`),
    );
  const upcomingSessions = sessions.filter((session) => session.status === BOOKING_STATUS.UPCOMING);
  const completedSessions = sessions.filter((session) => session.status === BOOKING_STATUS.COMPLETED);
  const tutorName = application?.name || user?.name || 'Tutor';
  const tutorType = application?.tutorType
    ?? user?.tutorType
    ?? (user?.role === ROLES.PROFESSIONAL ? TUTOR_TYPES.PROFESSIONAL : null);
  const tutorCategory = application?.tier
    ?? (tutorType === TUTOR_TYPES.PROFESSIONAL
      ? 'Professional Tutor'
      : tutorType === TUTOR_TYPES.PEER
        ? 'Peer Tutor'
        : 'Category not set');
  const courses = application?.courses ?? [];
  const preferredDays = application?.preferredDays ?? [];
  const preferredTimeSlots = application?.preferredTimeSlots ?? [];
  const verificationStatus = application?.verificationStatus ?? 'not_submitted';

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
    setSavingBookingDetails(true);
    setBookingDetailsError('');
    try {
      await updateTutorBookingDetails(uid, {
        hourlyRate: Number(hourlyRate),
      });
      Alert.alert('Booking details saved', 'Students can see your session token amount.');
      await loadApplication();
    } catch (error) {
      setBookingDetailsError(getErrorMessage(error, 'Couldn’t save your booking details.'));
    } finally {
      setSavingBookingDetails(false);
    }
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

  const verifyPayment = async (bookingId) => {
    if (workingBookingId) return;
    setWorkingBookingId(bookingId);
    setBookingActionError('');
    try {
      await confirmBookingPayment(bookingId);
    } catch (error) {
      setBookingActionError(getErrorMessage(error, 'Couldn’t verify this payment.'));
    } finally {
      setWorkingBookingId('');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.activeBanner}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Tutor workspace</Text>
        </View>
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
              {verificationStatus === 'approved' ? (
                <View style={styles.verified}><Ionicons name="checkmark" size={11} color={colors.white} /></View>
              ) : null}
            </View>
            <View style={styles.identity}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{tutorName}</Text>
                <Badge>{tutorCategory}</Badge>
              </View>
              <Text style={styles.education}>
                {application?.credentials || 'Add your credentials in your tutor application.'}
              </Text>
            </View>
          </View>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Verification status</Text>
            <Text style={styles.rate}>{verificationStatus.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.profileDescription}>
            {verificationStatus === 'approved'
              ? `${courses.length} course${courses.length === 1 ? '' : 's'} approved.`
              : verificationStatus === 'pending'
                ? 'Your application is waiting for admin review.'
                : verificationStatus === 'rejected'
                  ? application?.verificationNote || 'Your application needs changes before approval.'
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
              {verificationStatus === 'not_submitted'
                ? 'Start tutor application'
                : 'View application and course details'}
            </Text>
          </Pressable>
        </View>

        {canPerformTutorOperations ? (
          <>
        <SectionTitle title="Schedule and availability" subtitle="When students can book you" action="Edit times" />
        <View style={styles.availabilityCard}>
          <View style={styles.instantRow}>
            <View style={styles.instantIcon}><Ionicons name="flash" size={16} color={colors.secondary} /></View>
            <View style={styles.instantCopy}><Text style={styles.instantTitle}>Quick help sessions</Text><Text style={styles.instantSubtitle}>Let students request 15-minute drop-ins.</Text></View>
            <Switch value={instantHelp} onValueChange={setInstantHelp} trackColor={{ false: colors.border, true: colors.secondary }} thumbColor={colors.white} />
          </View>
          <Text style={styles.availabilityMeta}>
            Days: {preferredDays.length ? preferredDays.join(' · ') : 'Not set'}
          </Text>
          <Text style={styles.availabilityMeta}>
            Times: {preferredTimeSlots.length ? preferredTimeSlots.join(' · ') : 'Not set'}
          </Text>
        </View>

        <View style={styles.paymentSetupCard}>
          <SectionTitle title="Booking rate" subtitle="Set the token amount students need to book a session." />
          <AppInput
            label="Session tokens"
            value={hourlyRate}
            handleChangeText={setHourlyRate}
            placeholder="e.g. 280"
            keyboardType="decimal-pad"
          />
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
            <View key={request.id} style={styles.requestContainer}>
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

        <SectionTitle
          title="Confirm payments"
          subtitle={`${paymentsToVerify.length} transfer${paymentsToVerify.length === 1 ? '' : 's'} to review`}
          action="Check before confirming"
        />
        {paymentsToVerify.map((booking) => (
          <View key={booking.id} style={styles.paymentVerificationCard}>
            <View style={styles.requestCopy}>
              <Text style={styles.requestName}>{booking.studentName || 'Student'}</Text>
              <Text style={styles.requestMeta}>{booking.subject} · ₱{Number(booking.totalAmount || 0).toFixed(2)}</Text>
              <Text style={styles.requestNote}>Confirm only after checking the transfer in your payment app.</Text>
            </View>
            <AppButton
              title="Confirm payment"
              variant="secondary"
              onPress={() => verifyPayment(booking.id)}
              loading={workingBookingId === booking.id}
            />
          </View>
        ))}
        {bookingResults.status === 'ready' && !paymentsToVerify.length ? (
          <Text style={styles.emptyRequests}>Payment reports will appear here.</Text>
        ) : null}

        <SectionTitle
          title="Sessions"
          subtitle={`Upcoming (${upcomingSessions.length})`}
          action={`Past (${completedSessions.length})`}
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
              {verificationStatus === 'pending'
                ? 'Tutor tools will be available after your application is approved.'
                : verificationStatus === 'rejected'
                  ? 'Update your application for another review. Tutor tools remain unavailable until approval.'
                  : 'Submit an application to begin tutor verification. Tutor tools are available after approval.'}
            </Text>
            <AppButton
              title={verificationStatus === 'not_submitted' ? 'Apply to tutor' : 'Open tutor application'}
              variant="secondary"
              onPress={() => openTutorApplication(navigation)}
            />
          </View>
        )}

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  signOutError: { marginBottom: spacing.sm, color: colors.error, fontSize: 13 },
  paymentSetupCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  formError: { marginBottom: spacing.sm, color: colors.errorText, fontSize: 12, lineHeight: 17 },
  requestContainer: { marginBottom: spacing.sm },
  paymentVerificationCard: { gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  emptyRequests: { padding: spacing.md, borderRadius: radius.md, color: colors.mutedText, backgroundColor: colors.surface, fontSize: 12 },
  activeBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E6E8EA' },
  activeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6, backgroundColor: colors.secondary },
  activeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  profileCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, shadowColor: colors.black, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
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
  courseList: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  courseItem: { paddingVertical: 4 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  courseText: { flex: 1, color: colors.text, fontSize: 11 },
  proofSummary: { marginTop: spacing.xs },
  proofDetails: { flexShrink: 1, marginTop: 3, color: colors.mutedText, fontSize: 10, lineHeight: 15 },
  addCourse: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.background },
  addCourseText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  workspaceActions: { marginTop: spacing.sm },
  applicationAccessCard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeading: { color: colors.heading, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  sectionAction: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  availabilityCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  instantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  instantIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  instantCopy: { flex: 1 },
  instantTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  instantSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
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
  sessionCard: { flexDirection: 'row', marginBottom: spacing.sm, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surface },
  sessionAccent: { width: 5 },
  sessionCopy: { flex: 1, padding: spacing.sm },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionStatus: { color: colors.successText, fontSize: 9, fontWeight: '700' },
  sessionTime: { color: colors.mutedText, fontSize: 9 },
  sessionName: { marginTop: 4, color: colors.text, fontSize: 12, fontWeight: '700' },
  sessionMeta: { marginTop: 3, color: colors.mutedText, fontSize: 10 },
  sessionAction: { marginTop: 7, color: colors.primary, fontSize: 10, fontWeight: '700' },
  sessionActionMuted: { color: colors.mutedText, fontWeight: '400' },
});
