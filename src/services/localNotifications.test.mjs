import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLocalNotificationsModule } from './localNotifications.js';

test('local notifications load only the modules needed by local scheduling', () => {
  let handlerLoaded = false;
  const permissions = {
    getPermissionsAsync: () => 'current permission',
    requestPermissionsAsync: () => 'permission',
  };
  const notifications = createLocalNotificationsModule('android', {
    permissions,
    scheduler: { scheduleNotificationAsync: () => 'scheduled' },
    cancel: { cancelScheduledNotificationAsync: () => 'cancelled' },
    triggerTypes: { SchedulableTriggerInputTypes: { DAILY: 'daily' } },
    loadHandler: () => {
      handlerLoaded = true;
      return { setNotificationHandler: () => 'handler set' };
    },
  });

  assert.equal(notifications.getPermissionsAsync(), 'current permission');
  assert.equal(notifications.requestPermissionsAsync(), 'permission');
  assert.equal(notifications.scheduleNotificationAsync(), 'scheduled');
  assert.equal(notifications.cancelScheduledNotificationAsync(), 'cancelled');
  assert.equal(notifications.SchedulableTriggerInputTypes.DAILY, 'daily');
  assert.equal(handlerLoaded, false);
  notifications.setNotificationHandler({});
  assert.equal(handlerLoaded, true);
});

test('local notification adapter does not depend on Android channel creation', () => {
  const notifications = createLocalNotificationsModule('ios', {
    permissions: {},
    scheduler: {},
    cancel: {},
    triggerTypes: {},
    loadHandler: () => ({}),
  });

  assert.equal('setNotificationChannelAsync' in notifications, false);
  assert.equal('AndroidImportance' in notifications, false);
  assert.equal('setNotificationChannelAsync' in createLocalNotificationsModule('android', {
    permissions: {},
    scheduler: {},
    cancel: {},
    triggerTypes: {},
    loadHandler: () => ({}),
  }), false);
});

test('web does not load native notification modules', () => {
  assert.equal(createLocalNotificationsModule('web', {}), null);
});

test('notification adapter uses leaf modules rather than the package barrel', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('./localNotifications.js', import.meta.url), 'utf8');

  assert.match(source, /expo-notifications\/build\/NotificationPermissions/);
  assert.match(source, /expo-notifications\/build\/scheduleNotificationAsync/);
  assert.doesNotMatch(source, /require\(['"]expo-notifications['"]\)/);
});
