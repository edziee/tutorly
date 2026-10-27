import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// variant: 'primary' (default), 'secondary' (teal), 'success', 'outline'
// (white with a border) or 'danger' (red, for reject and log out).
// While `loading` is true the button shows a spinner and ignores presses, so a
// form cannot be sent twice.
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
}) {
  const inactive = disabled || loading;
  const spinnerColor = variant === 'outline'
    ? colors.primary
    : variant === 'danger'
      ? colors.errorText
      : colors.white;
  const iconColor = variant === 'outline'
    ? colors.primary
    : variant === 'danger'
      ? colors.errorText
      : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'success' && styles.successButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'danger' && styles.dangerButton,
        inactive && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Ionicons name={leftIcon} size={18} color={iconColor} /> : null}
          <Text
            style={[
              styles.text,
              variant === 'secondary' && styles.secondaryText,
              variant === 'outline' && styles.outlineText,
              variant === 'danger' && styles.dangerText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  successButton: {
    backgroundColor: colors.successText,
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.errorBackground,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
    flexShrink: 1,
    textAlign: 'center',
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.errorText,
  },
});
