// List of the user's in-app notifications, opened from the bell in the header.
// Use NotificationCard (src/components/NotificationCard.jsx) for each row, and
// LoadingState, EmptyState and ErrorState for the other cases.
// Layout: Member 3 (also the bell and toast).   Data: Member 4
// (notificationService, Week 2).
// Today the bell in AppHeader only shows a placeholder alert.
import PlaceholderScreen from './PlaceholderScreen';

export default function NotificationsScreen() {
  return <PlaceholderScreen title="Notifications" />;
}
