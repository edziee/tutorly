import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import { TOKEN_BOOKING_STATUS } from '../../constants/statuses';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBooking } from '../../services/bookingService';
import { useSubscription } from '../../hooks/useSubscription';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { formatTokenUnits } from '../../utils/tokens';

function tokenStatus(booking) {
  if (booking.tokenStatus === TOKEN_BOOKING_STATUS.PENDING) {
    return 'The request is pending. No tokens are deducted unless the tutor accepts it.';
  }
  if (booking.tokenStatus === TOKEN_BOOKING_STATUS.NOT_CHARGED) {
    return 'The request ended before acceptance, so no tokens were deducted.';
  }
  if (booking.tokenStatus === TOKEN_BOOKING_STATUS.RESERVED) {
    if (Number.isSafeInteger(booking.tokenDepositUnits)) {
      const remainingUnits = booking.tokenAmountUnits - booking.tokenDepositUnits;
      return `The 20% deposit (${formatTokenUnits(booking.tokenDepositUnits)} tokens) is held for the tutor. The remaining ${formatTokenUnits(remainingUnits)} tokens are held until the tutor marks the session complete.`;
    }
    return 'Tokens are held for this session and will transfer to the tutor when it is marked complete.';
  }
  if (booking.tokenStatus === TOKEN_BOOKING_STATUS.REFUNDED) {
    if (!Number.isSafeInteger(booking.tokenDepositUnits)) {
      return 'The booking ended, and its reserved tokens were returned to your available balance.';
    }
    return 'The booking was cancelled. The deposit was refunded and the remaining held tokens were returned to your available balance.';
  }
  if (booking.tokenStatus === TOKEN_BOOKING_STATUS.SETTLED) {
    return 'The session is complete, and the full session price was transferred to the tutor.';
  }
  return 'This is a historic peso booking. It did not move tokens in the wallet.';
}

export default function PaymentScreen({ navigation, route }) {
  const { user } = useAuth();
  const bookingId = route.params?.bookingId;
  const bookingState = useSubscription(
    (onData, onError) => (
      bookingId ? subscribeToBooking(bookingId, onData, onError) : undefined
    ),
    [bookingId, user?.uid],
  );

  if (!bookingId) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Choose a session"
          message="Select a session from your schedule to see its token status."
          onRetry={() => navigation.navigate(ROUTES.SCHEDULE)}
        />
      </ScreenContainer>
    );
  }
  if (bookingState.status === 'loading') {
    return <ScreenContainer><LoadingState message="Loading token details..." /></ScreenContainer>;
  }
  if (bookingState.status === 'error') {
    return (
      <ScreenContainer>
        <ErrorState
          title="Token details aren’t available"
          message={getErrorMessage(bookingState.error)}
          onRetry={bookingState.retry}
        />
      </ScreenContainer>
    );
  }
  if (!bookingState.data) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Session not found"
          message="Go to your schedule and choose a current session."
          onRetry={() => navigation.navigate(ROUTES.SCHEDULE)}
        />
      </ScreenContainer>
    );
  }

  const booking = bookingState.data;
  const hasTokenStatus = Boolean(booking.tokenStatus);
  const legacyAmount = Number(booking.totalAmount);
  const legacyAmountText = Number.isFinite(legacyAmount)
    ? `₱${legacyAmount.toFixed(2)} (legacy)`
    : 'Legacy amount unavailable';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headingRow}>
            <View style={styles.icon}>
              <Ionicons name="star" size={19} color={colors.primary} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.heading}>Booking tokens</Text>
              <Text style={styles.subheading}>{booking.subject || 'Tutoring session'}</Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Session amount</Text>
            <Text style={styles.amount}>
              {hasTokenStatus
                ? `${formatTokenUnits(booking.tokenAmountUnits)} tokens`
                : legacyAmountText}
            </Text>
          </View>
          {Number.isSafeInteger(booking.tokenDepositUnits) ? (
            <>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>20% deposit</Text>
                <Text style={styles.amount}>
                  {formatTokenUnits(booking.tokenDepositUnits)} tokens
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Remaining 80%</Text>
                <Text style={styles.amount}>
                  {formatTokenUnits(
                    booking.tokenAmountUnits - booking.tokenDepositUnits,
                  )} tokens
                </Text>
              </View>
            </>
          ) : null}
          <View style={styles.statusCard}>
            <Ionicons
              name={booking.tokenStatus === TOKEN_BOOKING_STATUS.SETTLED
                ? 'checkmark-circle-outline'
                : booking.tokenStatus === TOKEN_BOOKING_STATUS.REFUNDED
                  ? 'return-up-back-outline'
                  : 'time-outline'}
              size={21}
              color={colors.primary}
            />
            <Text style={styles.statusText}>{tokenStatus(booking)}</Text>
          </View>
          <Text style={styles.detail}>
            {booking.studentName || 'Student'} · {booking.tutorName || 'Tutor'}
          </Text>
          <Text style={styles.detail}>
            {booking.dateKey} · {booking.startTime} – {booking.endTime}
          </Text>
          <Text style={styles.notice}>
            Real-money top-ups and tutor cash-outs happen outside Tutorly through Google Forms.
            An administrator verifies those requests and records wallet changes.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  card: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.lavender },
  headingCopy: { flex: 1 },
  heading: { color: colors.heading, fontSize: 17, fontWeight: '700' },
  subheading: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  amountLabel: { color: colors.mutedText, fontSize: 12 },
  amount: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background },
  statusText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18 },
  detail: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 11 },
  notice: { marginTop: spacing.lg, color: colors.mutedText, fontSize: 11, lineHeight: 17 },
});
