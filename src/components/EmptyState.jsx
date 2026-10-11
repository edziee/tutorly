import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from './AppButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Shown when a list loaded fine but has nothing in it, for example "No
// sessions yet". Pass actionLabel and onAction to give the user a next step.
// `icon` is any Ionicons name (https://icons.expo.fyi, choose Ionicons).
export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={36} color={colors.mutedText} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AppButton title={actionLabel} onPress={onAction} />
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
