import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createDateNotificationTrigger,
  createLocalNotificationsModule,
} from './localNotifications.js';

test('local notifications expose the platform scheduling and permission APIs', () => {
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

test('session reminder trigger uses the SDK date trigger shape', () => {
  const date = new Date('2026-11-07T17:00:00.000Z');
  assert.deepEqual(
    createDateNotificationTrigger(date, { DATE: 'date' }),
    { type: 'date', date },
  );
});

test('local notifications expose the same scheduling APIs on iOS', () => {
  const notifications = createLocalNotificationsModule('ios', {
    permissions: { requestPermissionsAsync: () => 'permission' },
    scheduler: { scheduleNotificationAsync: () => 'scheduled' },
    cancel: {},
    triggerTypes: {},
    loadHandler: () => ({}),
  });

  assert.equal(notifications.requestPermissionsAsync(), 'permission');
  assert.equal(notifications.scheduleNotificationAsync(), 'scheduled');
});

test('web does not load native notification modules', () => {
  assert.equal(createLocalNotificationsModule('web', {}), null);
});

test('notification adapter uses leaf modules rather than the package barrel', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('./localNotifications.js', import.meta.url), 'utf8');

  assert.match(source, /expo-notifications\/build\/NotificationPermissions/);
  assert.match(source, /expo-notifications\/build\/scheduleNotificationAsync/);
  assert.doesNotMatch(source, /setNotificationChannelAsync/);
  assert.doesNotMatch(source, /require\(['"]expo-notifications['"]\)/);
});
