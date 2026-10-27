import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// One of the "Select academic portal role" cards on the login and sign-up
// screens. The selected card is white with a teal dot, the others are grey.
export default function RoleCard({ title, description, badge, icon, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={[styles.card, selected ? styles.selectedCard : styles.unselectedCard]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, selected && styles.selectedIconBox]}>
          <Ionicons
            name={icon}
            size={18}
            color={selected ? colors.inverseText : colors.mutedText}
          />
        </View>
        {badge ? (
          <View style={[styles.badge, selected && styles.selectedBadge]}>
            <Text style={[styles.badgeText, selected && styles.selectedBadgeText]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, selected && styles.selectedTitle]}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {selected ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg - 2,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unselectedCard: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  selectedIconBox: {
    backgroundColor: colors.primary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  selectedBadge: {
    backgroundColor: colors.mint,
  },
  badgeText: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '600',
  },
  selectedBadgeText: {
    color: colors.successText,
  },
  title: {
    ...typography.heading,
  },
  selectedTitle: {
    color: colors.primary,
  },
  description: {
    marginTop: 2,
    ...typography.caption,
  },
  dot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
});
