import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BOOKING_STATUS, VERIFICATION_STATUS } from '../constants/statuses';

// A small coloured label such as "Pending" or "Upcoming".
// tone: 'neutral' | 'info' | 'success' | 'warning' | 'error'
export default function StatusBadge({ label, tone = 'neutral' }) {
  const toneStyle = tones[tone] ?? tones.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.background }]}>
      <Text style={[styles.label, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

const tones = {
  neutral: { background: colors.divider, text: colors.text },
  info: { background: colors.lavender, text: colors.primary },
  success: { background: colors.mint, text: colors.successText },
  warning: { background: colors.paleYellow, text: colors.warningText },
  error: { background: colors.errorBackground, text: colors.errorText },
};

// Labels and tones for the fixed status values in src/constants/statuses.js, so
// every screen shows a given status the same way.
export const BOOKING_STATUS_BADGE = {
  [BOOKING_STATUS.REQUESTED]: { label: 'Requested', tone: 'warning' },
  [BOOKING_STATUS.UPCOMING]: { label: 'Upcoming', tone: 'info' },
  [BOOKING_STATUS.COMPLETED]: { label: 'Completed', tone: 'success' },
  [BOOKING_STATUS.REJECTED]: { label: 'Rejected', tone: 'error' },
  [BOOKING_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
};

export const VERIFICATION_STATUS_BADGE = {
  [VERIFICATION_STATUS.NOT_SUBMITTED]: { label: 'Not submitted', tone: 'neutral' },
  [VERIFICATION_STATUS.PENDING]: { label: 'Pending', tone: 'warning' },
  [VERIFICATION_STATUS.APPROVED]: { label: 'Approved', tone: 'success' },
  [VERIFICATION_STATUS.REJECTED]: { label: 'Rejected', tone: 'error' },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.badge,
  },
});
