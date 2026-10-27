import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function NotificationBell({ onPress }) {
  const { unreadCount, error } = useNotifications();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={error ? 'Notifications unavailable' : `Notifications, ${unreadCount} unread`}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      hitSlop={8}
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {unreadCount > 0 && <View style={styles.badge}><Text style={styles.count}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
      {error && <View style={styles.error} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -6, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  count: { ...typography.badge, color: colors.white },
  error: { position: 'absolute', top: 1, right: 1, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.error },
});
