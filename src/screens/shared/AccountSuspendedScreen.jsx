import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getAuthErrorMessage } from '../../utils/errors';

export default function AccountSuspendedScreen() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      await signOut();
    } catch (failure) {
      setError(getAuthErrorMessage(failure));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Account suspended</Text>
        <Text style={styles.message}>
          Access to Tutorly is paused. Your bookings, chats, and account history
          remain saved. Contact an administrator if you believe this is a mistake.
          Access will return when an administrator reactivates your account.
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <AppButton
          title="Sign out"
          variant="outline"
          onPress={handleSignOut}
          loading={signingOut}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  message: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  error: {
    color: colors.errorText,
    fontSize: 13,
  },
});
