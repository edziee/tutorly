import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// Two or three options side by side where exactly one is selected, like the
// "Sign In | Sign Up / Register" switch at the top of the login screen.
// options: [{ value: 'signIn', label: 'Sign In' }, ...]
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selectedSegment]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.divider,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
  },
  selectedSegment: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.mutedText,
    ...typography.label,
  },
  selectedLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});
