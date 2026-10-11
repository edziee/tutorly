import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Shown while a screen waits for data from Firebase. Every screen that loads
// data needs a loading, an empty (EmptyState) and an error (ErrorState) state.
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: spacing.md,
    color: colors.mutedText,
    fontSize: 14,
  },
});
