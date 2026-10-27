import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from './AppButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// Shown when loading or saving data failed. Pass onRetry to show a
// "Try again" button that runs the request again.
export default function ErrorState({
  title = 'We couldn’t load this',
  message = 'Please try again in a moment.',
  onRetry,
  compact = false,
}) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <View style={styles.action}>
          <AppButton title="Try again" onPress={onRetry} />
        </View>
      ) : null}
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
  title: {
    marginTop: spacing.md,
    ...typography.heading,
    textAlign: 'center',
  },
  compact: {
    flex: 0,
    flexBasis: 'auto', // plain flex: 0 makes the box zero tall on web, so the content spills out
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
  },
  message: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
