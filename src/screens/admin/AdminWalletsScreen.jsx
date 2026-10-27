import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import { ROLES, ROLE_LABELS, isTutorRole } from '../../constants/roles';
import { useAsync } from '../../hooks/useAsync';
import { useSubscription } from '../../hooks/useSubscription';
import { getUsers } from '../../services/adminService';
import {
  adjustWalletBalance,
  createWalletAdjustmentId,
  getAllWalletsForAdmin,
  subscribeToTokenTransactions,
} from '../../services/walletService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getErrorMessage } from '../../utils/errors';
import { formatTokenUnits } from '../../utils/tokens';

function entryDescription(entry) {
  const type = {
    admin_credit: 'Admin credit',
    admin_debit: 'Admin debit',
    booking_acceptance: 'Booking accepted · deposit charged; balance held',
    booking_deposit_hold: 'Booking deposit held',
    booking_deposit_refund: 'Held deposit refunded',
    booking_reserve: 'Booking hold',
    booking_refund: 'Booking refund',
    booking_settlement_debit: 'Booking payment',
    booking_settlement_credit: 'Session earnings',
  }[entry.type] ?? 'Token adjustment';
  return type;
}

function entryAmount(entry) {
  if (entry.type === 'booking_acceptance') {
    const depositUnits = entry.amountUnits - entry.heldDelta;
    return `−${formatTokenUnits(depositUnits)} tokens`;
  }
  if (entry.availableDelta !== 0) {
    const sign = entry.availableDelta > 0 ? '+' : '−';
    return `${sign}${formatTokenUnits(Math.abs(entry.availableDelta))}`;
  }
  const sign = entry.heldDelta > 0 ? '+' : '−';
  return `${sign}${formatTokenUnits(Math.abs(entry.heldDelta))} held`;
}

export default function AdminWalletsScreen() {
  const [accountRole, setAccountRole] = useState(ROLES.STUDENT);
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState('');
  const [direction, setDirection] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [formReference, setFormReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [adjustmentOperation, setAdjustmentOperation] = useState(null);

  const data = useAsync(async () => {
    const [users, wallets] = await Promise.all([getUsers(), getAllWalletsForAdmin()]);
    const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
    return users
      .filter((user) => user.role === ROLES.STUDENT || isTutorRole(user.role))
      .map((user) => ({
        ...user,
        wallet: walletById.get(user.id) ?? { availableUnits: 0, heldUnits: 0 },
      }));
  }, []);
  const selectedAccount = data.data?.find((user) => user.id === selectedUid) ?? null;
  const history = useSubscription(
    (onData, onError) => selectedUid
      ? subscribeToTokenTransactions(selectedUid, onData, onError)
      : undefined,
    [selectedUid],
  );
  const matchingUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const accounts = (data.data ?? []).filter((user) => (
      accountRole === ROLES.STUDENT
        ? user.role === ROLES.STUDENT
        : isTutorRole(user.role)
    ));
    if (!term) return accounts;
    return accounts.filter((user) =>
      [user.name, user.email, user.id]
        .some((value) => String(value ?? '').toLowerCase().includes(term)),
    );
  }, [accountRole, data.data, search]);

  const submitAdjustment = async () => {
    if (!selectedAccount) {
      setErrorMessage('Select a student or tutor account first.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const signature = JSON.stringify([
        selectedAccount.id,
        direction,
        amount,
        reason.trim(),
        formReference.trim(),
      ]);
      const operationId = adjustmentOperation?.signature === signature
        ? adjustmentOperation.id
        : createWalletAdjustmentId();
      setAdjustmentOperation({ signature, id: operationId });
      await adjustWalletBalance(selectedAccount.id, {
        direction,
        amountTokens: Number(amount),
        reason,
        formReference,
        operationId,
      });
      setSuccessMessage(
        `${direction === 'credit' ? 'Credited' : 'Debited'} ${amount} tokens for ${selectedAccount.name || selectedAccount.email}.`,
      );
      setAmount('');
      setReason('');
      setFormReference('');
      setAdjustmentOperation(null);
      data.retry();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not record this wallet adjustment.'));
    } finally {
      setBusy(false);
    }
  };

  if (data.status === 'loading') return <LoadingState message="Loading token wallets..." />;
  if (data.status === 'error') {
    return (
      <ErrorState
        title="Token wallets aren’t available"
        message={getErrorMessage(data.error)}
        onRetry={data.retry}
      />
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Verify top-ups and tutor cash-outs outside the app before recording a balance change.
          Every adjustment requires a Google Form or payment reference and is saved to the read-only ledger.
        </Text>
        <AppInput
          label="Find an account"
          value={search}
          handleChangeText={setSearch}
          placeholder="Name, email, or account ID"
          leftIcon="search-outline"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.roleTabs}>
          {[
            { role: ROLES.STUDENT, label: 'Students' },
            { role: ROLES.TUTOR, label: 'Tutors' },
          ].map(({ role, label }) => {
            const count = (data.data ?? []).filter((user) => (
              role === ROLES.STUDENT
                ? user.role === ROLES.STUDENT
                : isTutorRole(user.role)
            )).length;
            const selected = accountRole === role;
            return (
              <Pressable
                key={role}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setAccountRole(role);
                  setSelectedUid('');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={[styles.roleTab, selected && styles.roleTabSelected]}
              >
                <Text style={[styles.roleTabText, selected && styles.roleTabTextSelected]}>
                  {label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>
        {matchingUsers.length === 0 ? (
          <EmptyState
            compact
            icon="people-outline"
            title={search.trim() ? 'No accounts found' : `No ${accountRole === ROLES.STUDENT ? 'students' : 'tutors'} yet`}
            message={search.trim()
              ? `No ${accountRole === ROLES.STUDENT ? 'students' : 'tutors'} match your search.`
              : `There are no ${accountRole === ROLES.STUDENT ? 'student' : 'tutor'} wallets to show.`}
          />
        ) : (
          matchingUsers.map((item) => (
            <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: item.id === selectedUid }}
                onPress={() => {
                  setSelectedUid(item.id);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={[styles.account, item.id === selectedUid && styles.selectedAccount]}
            >
                <View style={styles.accountCopy}>
                  <Text numberOfLines={1} style={styles.accountName}>{item.name || item.email || item.id}</Text>
                  <Text numberOfLines={1} style={styles.accountMeta}>
                    {ROLE_LABELS[item.role] ?? 'Account'} · {item.email || item.id}
                  </Text>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={styles.balanceValue}>
                    {formatTokenUnits(item.wallet.availableUnits)}
                  </Text>
                  <Text style={styles.accountMeta}>tokens</Text>
                </View>
            </Pressable>
          ))
        )}

        {selectedAccount ? (
          <View style={styles.editor}>
            <Text style={styles.sectionTitle}>Adjust {selectedAccount.name || 'account'}</Text>
            <Text style={styles.balanceSummary}>
              {formatTokenUnits(selectedAccount.wallet.availableUnits)} available · {formatTokenUnits(selectedAccount.wallet.heldUnits)} held
            </Text>
            <View style={styles.directionRow}>
              {['credit', 'debit'].map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: direction === option }}
                  onPress={() => setDirection(option)}
                  style={[styles.direction, direction === option && styles.directionSelected]}
                >
                  <Ionicons
                    name={option === 'credit' ? 'add-circle-outline' : 'remove-circle-outline'}
                    size={17}
                    color={direction === option ? colors.white : colors.primary}
                  />
                  <Text style={[styles.directionText, direction === option && styles.directionTextSelected]}>
                    {option === 'credit' ? 'Credit' : 'Debit'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AppInput
              label="Token amount"
              value={amount}
              handleChangeText={setAmount}
              placeholder="For example, 100"
              keyboardType="decimal-pad"
            />
            <AppInput
              label="Reason (optional)"
              value={reason}
              handleChangeText={setReason}
              placeholder="Verified top-up, cash-out, correction..."
              multiline
            />
            <AppInput
              label="Google Form / payment reference (required)"
              value={formReference}
              handleChangeText={setFormReference}
              placeholder="Reference or response ID"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text>
            ) : null}
            {successMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.success}>{successMessage}</Text>
            ) : null}
            <AppButton
              title={direction === 'credit' ? 'Record token credit' : 'Record token debit'}
              variant={direction === 'credit' ? 'primary' : 'danger'}
              onPress={submitAdjustment}
              loading={busy}
            />

            <Text style={styles.sectionTitle}>Recent token activity</Text>
            {history.status === 'loading' ? (
              <LoadingState compact message="Loading ledger..." />
            ) : history.status === 'error' ? (
              <ErrorState
                compact
                title="Ledger isn’t available"
                message={getErrorMessage(history.error)}
                onRetry={history.retry}
              />
            ) : history.data?.length ? (
              history.data.map((entry) => (
                <View key={entry.id} style={styles.ledgerEntry}>
                  <View style={styles.accountCopy}>
                    <Text style={styles.ledgerTitle}>{entryDescription(entry)}</Text>
                    <Text style={styles.accountMeta}>{entry.reason || 'No reason provided'}</Text>
                    {entry.formReference ? (
                      <Text style={styles.accountMeta}>Reference: {entry.formReference}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.ledgerAmount}>
                    {entryAmount(entry)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noActivity}>No token activity recorded yet.</Text>
            )}
          </View>
        ) : (
          <Text style={styles.selectionHint}>Select an account to view its ledger or adjust its balance.</Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={data.retry}
          style={styles.refresh}
        >
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={styles.refreshText}>Refresh wallets</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  intro: { ...typography.bodySmall, marginBottom: spacing.md },
  roleTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  roleTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTabSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTabText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  roleTabTextSelected: { color: colors.white },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedAccount: { borderColor: colors.primary, backgroundColor: colors.lavender },
  accountCopy: { flex: 1 },
  accountName: { ...typography.label, color: colors.heading },
  accountMeta: { ...typography.caption, marginTop: 3 },
  accountBalance: { alignItems: 'flex-end' },
  balanceValue: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  editor: { marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  balanceSummary: { marginBottom: spacing.sm, color: colors.mutedText, fontSize: 11 },
  directionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  direction: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  directionSelected: { backgroundColor: colors.primary },
  directionText: { ...typography.label, color: colors.primary },
  directionTextSelected: { color: colors.white },
  error: { marginBottom: spacing.sm, color: colors.errorText, fontSize: 12 },
  success: { marginBottom: spacing.sm, color: colors.successText, fontSize: 12 },
  ledgerEntry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  ledgerTitle: { color: colors.text, fontSize: 11, fontWeight: '700' },
  ledgerAmount: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  noActivity: { paddingVertical: spacing.sm, color: colors.mutedText, fontSize: 11 },
  selectionHint: { marginTop: spacing.md, color: colors.mutedText, fontSize: 11, textAlign: 'center' },
  refresh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, padding: spacing.sm },
  refreshText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
