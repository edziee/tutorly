import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// A small number tile: an icon and label on top, a big value, and a caption.
// Used for "Hours / Sessions / Rating" on the student dashboard and for the
// counts on the admin dashboard. `value` is shown as it is, so format it first.
export default function StatCard({ icon, label, value, caption }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon ? <Ionicons name={icon} size={14} color={colors.mutedText} /> : null}
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    flexShrink: 1,
    color: colors.mutedText,
    ...typography.caption,
  },
  value: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    marginTop: 2,
    ...typography.caption,
    color: colors.successText,
  },
});
