import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

// The bell for the header of screens that do not use AppHeader (tutor,
// professional and admin). Pass `navigation.navigate(ROUTES.NOTIFICATIONS)` as
// onPress. Used as `headerRight` in those navigators.
export default function NotificationBell({ onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      hitSlop={8}
      onPress={onPress}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
    </Pressable>
  );
}
