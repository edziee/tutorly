import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  calculateStudentDailyLogin,
  STREAK_MILESTONES,
} from '../utils/studentStreak';

const streakStorageKey = (uid) => `tutorly.studentStreak.v1.${uid}`;

export async function recordStudentDailyLogin(uid, profile, date = new Date()) {
  if (!uid) throw new Error('A signed-in student is required to record a streak.');
  const key = streakStorageKey(uid);
  const saved = await AsyncStorage.getItem(key);
  const storedState = saved ? JSON.parse(saved) : null;
  const result = calculateStudentDailyLogin(storedState, profile, date);
  if (!result.firstLoginToday) {
    if (JSON.stringify(storedState?.activityDates ?? []) !== JSON.stringify(result.activityDates)) {
      await AsyncStorage.setItem(key, JSON.stringify({
        ...storedState,
        activityDates: result.activityDates,
      }));
    }
    return result;
  }

  await AsyncStorage.setItem(key, JSON.stringify({
    streakDays: result.streakDays,
    lastLoginDate: result.lastLoginDate,
    activityDates: result.activityDates,
    reminderEnabled: storedState?.reminderEnabled === true,
    reminderNotificationId: storedState?.reminderNotificationId ?? null,
  }));
  return result;
}

async function readStreakState(uid) {
  const saved = await AsyncStorage.getItem(streakStorageKey(uid));
  return saved ? JSON.parse(saved) : {};
}

export async function getStudentStreakActivityDates(uid) {
  if (!uid) throw new Error('A signed-in student is required to view streak activity.');
  const state = await readStreakState(uid);
  return Array.isArray(state.activityDates) ? state.activityDates : [];
}

async function writeStreakState(uid, changes) {
  const current = await readStreakState(uid);
  await AsyncStorage.setItem(streakStorageKey(uid), JSON.stringify({ ...current, ...changes }));
}

export async function getStudentStreakReminderEnabled(uid) {
  if (!uid) return false;
  const state = await readStreakState(uid);
  return state.reminderEnabled === true;
}

function getNotificationsModule() {
  if (Platform.OS === 'web') return null;
  return require('expo-notifications');
}

export async function enableStudentStreakReminder(uid) {
  if (!uid) throw new Error('A signed-in student is required to enable streak reminders.');
  const notifications = getNotificationsModule();
  if (!notifications) return false;

  const permission = await notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('streak-reminders', {
      name: 'Study streak reminders',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await readStreakState(uid);
  if (current.reminderNotificationId) {
    await notifications.cancelScheduledNotificationAsync(current.reminderNotificationId);
  }
  const trigger = notifications.SchedulableTriggerInputTypes
    ? {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    }
    : { hour: 20, minute: 0, repeats: true };
  const notificationId = await notifications.scheduleNotificationAsync({
    content: {
      title: 'Keep your study streak going',
      body: 'Study today to keep your Tutorly streak alive.',
      data: { type: 'student_streak_reminder' },
      ...(Platform.OS === 'android' ? { channelId: 'streak-reminders' } : {}),
    },
    trigger,
  });
  await writeStreakState(uid, {
    reminderEnabled: true,
    reminderNotificationId: notificationId,
  });
  return true;
}

export async function disableStudentStreakReminder(uid) {
  if (!uid) throw new Error('A signed-in student is required to disable streak reminders.');
  const notifications = getNotificationsModule();
  const current = await readStreakState(uid);
  if (notifications && current.reminderNotificationId) {
    await notifications.cancelScheduledNotificationAsync(current.reminderNotificationId);
  }
  await writeStreakState(uid, {
    reminderEnabled: false,
    reminderNotificationId: null,
  });
}

export async function notifyStudentStreakMilestone(uid, milestone) {
  if (!STREAK_MILESTONES.includes(milestone) ||
      !(await getStudentStreakReminderEnabled(uid))) return;
  const notifications = getNotificationsModule();
  if (!notifications) return;
  await notifications.scheduleNotificationAsync({
    content: {
      title: `${milestone}-day study streak!`,
      body: `Amazing work—your study streak reached ${milestone} days.`,
      data: { type: 'student_streak_milestone', milestone },
    },
    trigger: null,
  });
}
