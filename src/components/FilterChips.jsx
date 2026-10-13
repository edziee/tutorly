import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

// A row of pill buttons that scrolls sideways, one selected at a time. Used to
// filter a list, for example the admin users by role.
// options: [{ value: 'all', label: 'All' }, ...]
export default function FilterChips({ options, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.selectedChip]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Without this a horizontal ScrollView can shrink to nothing when a sibling
  // below it (an empty or error state) asks for room.
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.inverseText,
  },
});
