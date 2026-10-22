import { createContext, useContext } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { subscribeToNotifications } from '../services/notificationService';
import { getUserId } from '../utils/user';

const NotificationContext = createContext({ notifications: [], unreadCount: 0, status: 'ready', error: null });

function NotificationFeed({ userId, children }) {
  const enabled = isFirebaseConfigured && Boolean(userId);
  const subscription = useSubscription(
    (onData, onError) => enabled ? subscribeToNotifications(userId, onData, onError) : undefined,
    [userId, enabled],
  );
  const notifications = enabled && subscription.data ? subscription.data : [];
  return (
    <NotificationContext.Provider value={{
      ...subscription, status: enabled ? subscription.status : 'ready',
      notifications, unreadCount: notifications.filter((item) => !item.read).length,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  // Reset the feed immediately when identities change; never show another user's badge.
  return <NotificationFeed key={userId || 'signed-out'} userId={userId}>{children}</NotificationFeed>;
}

export const useNotifications = () => useContext(NotificationContext);
