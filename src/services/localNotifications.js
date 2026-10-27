export function createLocalNotificationsModule(platform, {
  permissions,
  scheduler,
  cancel,
  triggerTypes,
  loadHandler,
}) {
  if (platform === 'web') return null;

  return {
    getPermissionsAsync: permissions.getPermissionsAsync,
    requestPermissionsAsync: permissions.requestPermissionsAsync,
    scheduleNotificationAsync: scheduler.scheduleNotificationAsync,
    cancelScheduledNotificationAsync: cancel.cancelScheduledNotificationAsync,
    SchedulableTriggerInputTypes: triggerTypes.SchedulableTriggerInputTypes,
    setNotificationHandler: (...args) => loadHandler().setNotificationHandler(...args),
  };
}

export function getLocalNotificationsModule(platform) {
  if (platform === 'web') return null;

  const dependencies = {
    permissions: require('expo-notifications/build/NotificationPermissions'),
    scheduler: require('expo-notifications/build/scheduleNotificationAsync'),
    cancel: require('expo-notifications/build/cancelScheduledNotificationAsync'),
    triggerTypes: require('expo-notifications/build/Notifications.types'),
    loadHandler: () => require('expo-notifications/build/NotificationsHandler'),
  };
  return createLocalNotificationsModule(platform, dependencies);
}
