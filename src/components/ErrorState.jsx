import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from './AppButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Shown when loading or saving data failed. Pass onRetry to show a
// "Try again" button that runs the request again.
export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
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
    color: colors.heading,
    fontSize: 18,
    fontWeight: '700',
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
    color: colors.mutedText,
    fontSize: 14,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
