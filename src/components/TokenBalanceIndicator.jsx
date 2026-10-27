import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getTokenFormUrl } from '../config/tokenForms';
import { ROLES } from '../constants/roles';
import { useSubscription } from '../hooks/useSubscription';
import { subscribeToWallet } from '../services/walletService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatTokenUnits } from '../utils/tokens';
import { getErrorMessage } from '../utils/errors';
import { assertApprovedTutor } from '../services/tutorService';

export default function TokenBalanceIndicator({ userId, role, onBalancePress }) {
  const wallet = useSubscription(
    (onData, onError) => userId
      ? subscribeToWallet(userId, onData, onError)
      : undefined,
    [userId],
  );
  const [openingForm, setOpeningForm] = useState(false);
  if (![ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL].includes(role)) return null;

  const balanceText = wallet.status === 'ready'
    ? formatTokenUnits(wallet.data?.availableUnits)
    : wallet.status === 'error'
      ? '!'
      : '…';
  const actionTitle = role === ROLES.STUDENT ? 'Request token top-up' : 'Request tutor cash-out';
  const openRequestForm = async () => {
    if (openingForm) return;
    if (wallet.status === 'error') {
      Alert.alert('Token balance unavailable', getErrorMessage(wallet.error));
      return;
    }
    const formUrl = getTokenFormUrl(role);
    if (!formUrl) {
      Alert.alert(
        'Form not configured',
        role === ROLES.STUDENT
          ? 'The student token top-up Google Form has not been configured.'
          : 'The tutor token cash-out Google Form has not been configured.',
      );
      return;
    }
    setOpeningForm(true);
    try {
      if ([ROLES.TUTOR, ROLES.PROFESSIONAL].includes(role)) {
        await assertApprovedTutor(userId);
      }
      await Linking.openURL(formUrl);
    } catch (error) {
      Alert.alert('Could not open the form', getErrorMessage(error));
    } finally {
      setOpeningForm(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={wallet.status === 'ready'
          ? `${balanceText} tokens. Open wallet history`
          : 'Token balance unavailable. Open wallet'}
        onPress={onBalancePress}
        style={styles.balanceButton}
      >
        <View style={styles.tokenIcon}>
          <Ionicons name="star" size={14} color={colors.white} />
        </View>
        <Text numberOfLines={1} style={styles.balance}>{balanceText}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionTitle}
        accessibilityState={{ busy: openingForm }}
        onPress={openRequestForm}
        style={styles.addButton}
      >
        <Ionicons name="add" size={17} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 34,
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 3,
    paddingRight: 4,
    borderRadius: 18,
    backgroundColor: colors.lavender,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  balanceButton: {
    minWidth: 59,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tokenIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  balance: {
    minWidth: 24,
    flexShrink: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  addButton: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.secondary,
    marginLeft: spacing.xs,
  },
});
