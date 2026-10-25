import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { subscribeToNotifications } from '../services/notificationService';
import { getUserId } from '../utils/user';

const NotificationContext = createContext({ notifications: [], unreadCount: 0, status: 'ready', error: null });
const notificationSound = require('../../assets/notification.wav');

function NotificationFeed({ userId, children }) {
  const enabled = isFirebaseConfigured && Boolean(userId);
  const audioPlayer = useAudioPlayer(notificationSound);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const knownNotificationIds = useRef(null);
  const pendingSound = useRef(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const subscription = useSubscription(
    (onData, onError) => enabled ? subscribeToNotifications(userId, onData, onError) : undefined,
    [userId, enabled],
  );
  const notifications = enabled && subscription.data ? subscription.data : [];

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppState(state);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!enabled || subscription.status !== 'ready' || !subscription.data) {
      knownNotificationIds.current = null;
      return;
    }
    if (subscription.metadata?.fromCache !== false) return;

    const nextIds = new Set(notifications.map((notification) => notification.id));
    const hasNewNotification = knownNotificationIds.current !== null &&
      [...nextIds].some((id) => !knownNotificationIds.current.has(id));
    knownNotificationIds.current = nextIds;
    if (hasNewNotification && appState === 'active') pendingSound.current = true;
    if (appState !== 'active') pendingSound.current = false;
    if (!pendingSound.current || !audioStatus.isLoaded) return;

    pendingSound.current = false;
    audioPlayer.seekTo(0)
      .then(() => audioPlayer.play())
      .catch((error) => console.warn('Could not play the in-app notification sound:', error));
  }, [
    appState,
    audioPlayer,
    audioStatus.isLoaded,
    enabled,
    notifications,
    subscription.data,
    subscription.metadata,
    subscription.status,
  ]);

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
