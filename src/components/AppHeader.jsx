import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import StudentAvatar from './StudentAvatar';
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

export function AppHeaderActions({
  initials,
  imageUri,
  onProfilePress,
  onNotificationsPress,
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={8}
        onPress={
          onNotificationsPress ??
          (() => Alert.alert('Notifications', 'No new notifications.'))
        }
      >
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.text}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open student profile"
        hitSlop={8}
        onPress={onProfilePress}
        style={styles.avatarButton}
      >
        <StudentAvatar imageUri={imageUri} initials={initials} size={30} />
        <View style={styles.onlineDot} />
      </Pressable>
    </View>
  );
}

export default function AppHeader({
  title,
  initials,
  imageUri,
  onProfilePress,
  onNotificationsPress,
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <AppHeaderBrand title={title} />
        <AppHeaderActions
          initials={initials}
          imageUri={imageUri}
          onProfilePress={onProfilePress}
          onNotificationsPress={onNotificationsPress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  avatarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
