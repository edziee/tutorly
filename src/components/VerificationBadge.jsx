import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { VERIFICATION_STATUS } from '../constants/statuses';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { VERIFICATION_STATUS_BADGE } from './StatusBadge';

const toneStyles = {
  neutral: {
    backgroundColor: colors.divider,
    borderColor: colors.border,
    color: colors.mutedText,
    icon: 'document-text-outline',
  },
  warning: {
    backgroundColor: colors.paleYellow,
    borderColor: colors.warning,
    color: colors.warningText,
    icon: 'time-outline',
  },
  success: {
    backgroundColor: colors.mint,
    borderColor: colors.success,
    color: colors.successText,
    icon: 'shield-checkmark',
  },
  error: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.error,
    color: colors.errorText,
    icon: 'alert-circle-outline',
  },
};

export default function VerificationBadge({
  status = VERIFICATION_STATUS.APPROVED,
  label,
  align = 'start',
}) {
  const statusConfig = VERIFICATION_STATUS_BADGE[status];
  const tone = toneStyles[statusConfig?.tone ?? 'neutral'];
  const statusLabel = label ?? statusConfig?.label ?? status;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={statusLabel}
      style={[
        styles.badge,
        { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor },
        align === 'end' && styles.alignEnd,
      ]}
    >
      <Ionicons name={tone.icon} size={14} color={tone.color} />
      <Text style={[styles.label, { color: tone.color }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.badge,
  },
  alignEnd: {
    alignSelf: 'flex-end',
  },
});
