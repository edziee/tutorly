import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

// One row in the notifications list.
// notification: { title: string, message: string, time: string, read: boolean }
// `time` is text to show ("1 hour ago"). Turn the Firestore timestamp into text
// in the screen, not here, so this card stays simple.
export default function NotificationCard({ notification, onPress }) {
  const { title, message, time, read } = notification;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${read ? '' : 'Unread. '}${title}. ${message}`}
      onPress={onPress}
      style={[styles.card, !read && styles.unreadCard]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {!read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.message}>{message}</Text>
        {time ? <Text style={styles.time}>{time}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unreadCard: {
    backgroundColor: colors.paleBlue,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: colors.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
    backgroundColor: colors.secondary,
  },
  message: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 14,
  },
  time: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: 12,
  },
});
