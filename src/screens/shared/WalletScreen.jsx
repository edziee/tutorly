import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import { getTokenFormUrl } from '../../config/tokenForms';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { subscribeToTokenTransactions, subscribeToWallet } from '../../services/walletService';
import { assertApprovedTutor } from '../../services/tutorService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { formatTokenUnits } from '../../utils/tokens';

const entryLabels = {
  admin_credit: 'Tokens added by admin',
  admin_debit: 'Tokens collected by admin',
  booking_reserve: 'Booking tokens reserved',
  booking_refund: 'Booking tokens refunded',
  booking_settlement_debit: 'Booking tokens paid',
  booking_settlement_credit: 'Session earnings',
};
const creditTypes = new Set([
  'admin_credit',
  'booking_refund',
  'booking_settlement_credit',
]);

function formatDate(value) {
  if (!value || typeof value.toDate !== 'function') return 'Recently';
  return value.toDate().toLocaleString();
}

export default function WalletScreen() {
  const { user } = useAuth();
  const [openingForm, setOpeningForm] = useState(false);
  const wallet = useSubscription(
    (onData, onError) => user?.uid
      ? subscribeToWallet(user.uid, onData, onError)
      : undefined,
    [user?.uid],
  );
  const history = useSubscription(
    (onData, onError) => user?.uid
      ? subscribeToTokenTransactions(user.uid, onData, onError)
      : undefined,
    [user?.uid],
  );

  const openRequestForm = async () => {
    if (openingForm) return;
    const formUrl = getTokenFormUrl(user?.role);
    if (!formUrl) {
      Alert.alert(
        'Form not configured',
        user?.role === ROLES.STUDENT
          ? 'The student token top-up Google Form has not been configured.'
          : 'The tutor cash-out Google Form has not been configured.',
      );
      return;
    }
    setOpeningForm(true);
    try {
      if ([ROLES.TUTOR, ROLES.PROFESSIONAL].includes(user?.role)) {
        await assertApprovedTutor(user.uid);
      }
      await Linking.openURL(formUrl);
    } catch (error) {
      Alert.alert('Could not open the form', getErrorMessage(error));
    } finally {
      setOpeningForm(false);
    }
  };

  if (!user?.uid) {
    return (
      <ErrorState
        title="Wallet isn’t available"
        message="Sign in again to open your token wallet."
      />
    );
  }
  if (wallet.status === 'loading') return <LoadingState message="Loading your token wallet..." />;
  if (wallet.status === 'error') {
    return (
      <ErrorState
        title="Wallet isn’t available"
        message={getErrorMessage(wallet.error)}
        onRetry={wallet.retry}
      />
    );
  }

  const available = wallet.data?.availableUnits;
  const held = wallet.data?.heldUnits;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="star" size={22} color="#7A4B00" />
          </View>
          <Text style={styles.balanceLabel}>Available tokens</Text>
          <Text style={styles.balance}>{formatTokenUnits(available)}</Text>
          <Text style={styles.held}>
            {formatTokenUnits(held)} tokens currently held for bookings
          </Text>
          <AppButton
            title={user.role === ROLES.STUDENT ? 'Request a top-up' : 'Request a cash-out'}
            onPress={openRequestForm}
            loading={openingForm}
          />
          <Text style={styles.formNote}>
            Admins verify Google Form requests and update balances manually. Any external fees must be disclosed before processing.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {history.status === 'loading' ? (
          <LoadingState compact message="Loading your activity..." />
        ) : history.status === 'error' ? (
          <ErrorState
            compact
            title="Activity isn’t available"
            message={getErrorMessage(history.error)}
            onRetry={history.retry}
          />
        ) : history.data?.length ? (
          history.data.map((entry) => {
            const isCredit = creditTypes.has(entry.type);
            return (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryTitle}>
                    {entryLabels[entry.type] ?? 'Token activity'}
                  </Text>
                  <Text style={styles.entryMeta}>{formatDate(entry.createdAt)}</Text>
                  {entry.reason ? <Text style={styles.entryMeta}>{entry.reason}</Text> : null}
                </View>
                <Text style={[styles.entryAmount, isCredit ? styles.credit : styles.debit]}>
                  {isCredit ? '+' : '−'}{formatTokenUnits(entry.amountUnits)}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>No token activity recorded yet.</Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  balanceCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: 22,
    backgroundColor: '#F5B72E',
    borderWidth: 2,
    borderColor: '#D99012',
  },
  balanceLabel: { color: colors.mutedText, fontSize: 12, fontWeight: '600' },
  balance: { marginTop: spacing.xs, color: colors.heading, fontSize: 30, fontWeight: '800' },
  held: { marginTop: spacing.xs, marginBottom: spacing.md, color: colors.mutedText, fontSize: 11 },
  formNote: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  sectionTitle: { marginBottom: spacing.sm, color: colors.heading, fontSize: 16, fontWeight: '700' },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryCopy: { flex: 1 },
  entryTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  entryMeta: { marginTop: 3, color: colors.mutedText, fontSize: 10, lineHeight: 15 },
  entryAmount: { fontSize: 13, fontWeight: '800' },
  credit: { color: colors.successText },
  debit: { color: colors.heading },
  empty: { paddingVertical: spacing.md, color: colors.mutedText, fontSize: 12, textAlign: 'center' },
});
