// List of the user's in-app notifications, opened from the bell in the header.
// Layout: Member 3.   Data: Member 4 (notificationService, Week 2).
// Plan tasks: "Build the notification bell and toast" (Member 3, Week 2) and
// "In-app notifications triggered by booking events and new messages" (Member 4).
//
// It listens to notificationService.subscribeToNotifications(userId, callback)
// and expects each notification to look like the `notifications` document in
// docs/FIRESTORE_SCHEMA.md, with its document id as `id`:
//   { id, title, message, read, createdAt, type, data }
// `createdAt` can be a Firestore timestamp. The screen turns it into "5 minutes
// ago" with timeAgo(), and gives NotificationCard plain text.
//
// Tapping a message alert marks it read and opens its conversation. The feed
// is shared with the header bell through NotificationContext.
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import NotificationCard from '../../components/NotificationCard';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROUTES } from '../../constants/routes';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { timeAgo } from '../../utils/format';
import { getUserId } from '../../utils/user';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const userId = getUserId(user);

  const { status, notifications, error, retry } = useNotifications();

  const showSaveError = (failure) =>
    Alert.alert('Could not update', getErrorMessage(failure, 'Please try again.'));

  const handlePress = async (notification) => {
    try {
      if (!notification.read) await markNotificationRead(notification.id);
      if (notification.type === 'new_message' && notification.data?.conversationId) {
        navigation.navigate(ROUTES.CONVERSATION, { conversationId: notification.data.conversationId });
      }
    } catch (failure) { showSaveError(failure); }
  };

  const handleMarkAll = () => {
    markAllNotificationsRead(userId).catch(showSaveError);
  };

  if (!userId) {
    return (
      <EmptyState
        icon="notifications-off-outline"
        title="You are not logged in"
        message="Log in to see your notifications."
      />
    );
  }
  if (status === 'loading') return <LoadingState message="Loading notifications..." />;
  if (status === 'error') {
    return (
      <ErrorState
        title="Could not load notifications"
        message={getErrorMessage(error)}
        onRetry={retry}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="notifications-outline"
        title="No notifications yet"
        message="Booking updates and new messages will show up here."
      />
    );
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <ScreenContainer>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.summary}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
            {unreadCount > 0 ? (
              <View style={styles.markAll}>
                <AppButton title="Mark all as read" variant="outline" onPress={handleMarkAll} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <NotificationCard
            notification={{
              title: item.title,
              message: item.message,
              read: item.read === true,
              time: timeAgo(item.createdAt),
            }}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summary: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  markAll: {
    minWidth: 150,
  },
});
