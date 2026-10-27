import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// Shown while a screen waits for data from Firebase. Every screen that loads
// data needs a loading, an empty (EmptyState) and an error (ErrorState) state.
export default function LoadingState({ message = 'Loading...', compact = false }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[styles.container, compact && styles.compact]}
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
  compact: {
    flex: 0,
    flexBasis: 'auto', // plain flex: 0 makes the box zero tall on web, so the content spills out
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.mutedText,
  },
});
