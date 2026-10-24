import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS } from '../../constants/statuses';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBooking } from '../../services/bookingService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { useSubscription } from '../../hooks/useSubscription';
import { getErrorMessage } from '../../utils/errors';

function formatDate(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Date unavailable';
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function money(value) {
  return Number.isFinite(value) ? `₱${value.toFixed(2)}` : 'Price unavailable';
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
          message="Select an accepted session from your schedule to see its payment details."
          onRetry={() => navigation.navigate(ROUTES.SCHEDULE)}
        />
      </ScreenContainer>
    );
  }

  if (bookingState.status === 'loading') {
    return <ScreenContainer><LoadingState message="Loading payment details..." /></ScreenContainer>;
  }
  if (bookingState.status === 'error') {
    return (
      <ScreenContainer>
        <ErrorState
          title="Payment details aren’t available"
          message={getErrorMessage(bookingState.error)}
          onRetry={bookingState.retry}
        />
      </ScreenContainer>
    );
  }

  const booking = bookingState.data;
  if (!booking) {
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

  const isAccepted = booking.status === BOOKING_STATUS.UPCOMING;
  const alreadyReported = booking.paymentStatus === BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION;
  const isSettled = booking.paymentStatus === BOOKING_PAYMENT_STATUS.SETTLED;
  const amount = Number(booking.totalAmount);

  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to schedule"
            onPress={() => navigation.navigate(ROUTES.SCHEDULE)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Session payment</Text>
            <Text style={styles.headerSubtitle}>Payment details</Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={23} color={colors.primary} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.policyBanner}>
            <View style={styles.policyIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.policyCopy}>
              <Text style={styles.policyTitle}>Payment instructions unavailable</Text>
              <Text style={styles.policyText}>
                Payment options are being updated. You can review the session fee here, but payment is not available yet.
              </Text>
            </View>
          </View>

          <View style={styles.sessionCard}>
            <View style={styles.tutorRow}>
              <View style={styles.tutorAvatar}>
                {booking.tutorPhotoUrl ? (
                  <Image source={{ uri: booking.tutorPhotoUrl }} style={styles.tutorImage} />
                ) : (
                  <Text style={styles.tutorInitial}>{(booking.tutorName || 'T').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.tutorCopy}>
                <Text style={styles.tutorName}>{booking.tutorName}</Text>
                <Text style={styles.tutorMeta}>
                  {[booking.subject, booking.tutorTier].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text style={styles.totalAmount}>{money(amount)}</Text>
            </View>
            <View style={styles.sessionDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{formatDate(booking.dateKey)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>
                  {booking.startTime} – {booking.endTime} ({booking.durationHours} hr{booking.durationHours === 1 ? '' : 's'})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{booking.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="book-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{booking.sessionMode || 'Session format not specified'}</Text>
              </View>
            </View>
            <Text style={styles.sessionNote}>
              Includes up to 3 hours. Agree on any extra time with your tutor before the session.
            </Text>
          </View>

          <View style={styles.paymentCard}>
            <Ionicons name="time-outline" size={28} color={colors.mutedText} />
            <Text style={styles.paymentNoticeTitle}>Payment isn’t available yet</Text>
            <Text style={styles.paymentNoticeText}>
              {booking.status === BOOKING_STATUS.REQUESTED
                ? 'Payment instructions will be available after the payment options are updated.'
                : 'Payment instructions will appear here when they are available.'}
            </Text>
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.sectionTitle}>Price summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Session fee</Text>
              <Text style={styles.priceValue}>{money(amount)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.waived}>₱0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total to pay your tutor</Text>
              <Text style={styles.totalValue}>{money(amount)}</Text>
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          {isSettled ? (
            <View style={styles.reportedBanner}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.successText} />
              <Text style={styles.reportedText}>Your tutor confirmed payment</Text>
            </View>
          ) : alreadyReported ? (
            <View style={styles.reportedBanner}>
              <Ionicons name="time-outline" size={18} color={colors.successText} />
              <Text style={styles.reportedText}>Payment reported · Waiting for tutor confirmation</Text>
            </View>
          ) : !isAccepted ? (
            <View style={styles.reportedBanner}>
              <Ionicons name="hourglass-outline" size={18} color={colors.mutedText} />
              <Text style={styles.reportedText}>
                {booking.status === BOOKING_STATUS.REQUESTED
                  ? 'Payment instructions will be available when payment options are ready.'
                  : 'This booking is no longer active. No payment is due.'}
              </Text>
            </View>
          ) : (
            <AppButton title="Payment unavailable" disabled />
          )}
          {!isSettled && !alreadyReported ? (
            <Text style={styles.footerNote}>You can’t report a payment until payment options are available.</Text>
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, margin: -spacing.md, backgroundColor: colors.background },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.background },
  backButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.heading, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 10 },
  content: { gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.md },
  policyBanner: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#EFF0F4' },
  policyIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: '#E3E4E8' },
  policyCopy: { flex: 1 },
  policyTitle: { color: colors.heading, fontSize: 11, fontWeight: '700' },
  policyText: { marginTop: 3, color: colors.mutedText, fontSize: 9, lineHeight: 14 },
  sessionCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  tutorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tutorAvatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.mint, overflow: 'hidden' },
  tutorImage: { width: 42, height: 42 },
  tutorInitial: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  tutorCopy: { flex: 1 },
  tutorName: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  tutorMeta: { marginTop: 2, color: colors.mutedText, fontSize: 9 },
  totalAmount: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  sessionDetails: { gap: 7, marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#F2F4F6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { flex: 1, color: colors.text, fontSize: 10 },
  sessionNote: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 9, lineHeight: 14 },
  paymentCard: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  sectionTitle: { color: colors.heading, fontSize: 14, fontWeight: '700' },
  paymentNoticeTitle: { color: colors.heading, fontSize: 12, fontWeight: '700' },
  paymentNoticeText: { color: colors.mutedText, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  priceCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  priceLabel: { color: colors.mutedText, fontSize: 10 },
  priceValue: { color: colors.text, fontSize: 10, fontWeight: '600' },
  waived: { color: colors.successText, fontSize: 10, fontWeight: '700' },
  divider: { height: 1, marginTop: spacing.sm, backgroundColor: colors.divider },
  totalLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  totalValue: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  footer: { gap: spacing.xs, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  reportedBanner: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: '#DFF5EF' },
  reportedText: { flexShrink: 1, color: colors.successText, fontSize: 11, fontWeight: '700' },
  footerNote: { color: colors.mutedText, fontSize: 9, textAlign: 'center' },
});
