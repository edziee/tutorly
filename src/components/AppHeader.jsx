import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function AppHeaderBrand({ title }) {
  return (
    <View style={styles.brand}>
      <View style={styles.logo}>
        <Ionicons name="school" size={17} color={colors.primary} />
      </View>
      <Text style={styles.brandName}>Tutorly</Text>
      <Text style={styles.divider}>|</Text>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

export function AppHeaderActions() {
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={8}
        onPress={() => Alert.alert('Notifications', 'No new notifications.')}
      >
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.text}
        />
      </Pressable>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>E</Text>
        <View style={styles.onlineDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    color: colors.mutedText,
    marginHorizontal: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#C8CBD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});
