import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// A tick box with a label next to it. `children` is the label, so it can hold
// a <Text> with bold parts. `error` is the message shown under it.
export default function Checkbox({ checked, onChange, children, error }) {
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.checkedBox, error && styles.errorBox]}>
          {checked ? <Ionicons name="checkmark" size={13} color={colors.inverseText} /> : null}
        </View>
        <View style={styles.label}>{children}</View>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  box: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.mutedText,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkedBox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  errorBox: {
    borderColor: colors.error,
  },
  label: {
    flex: 1,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: 30,
    color: colors.errorText,
    fontSize: 12,
  },
});
