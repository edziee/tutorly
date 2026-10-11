// In-app notifications (notifications/{id}): alerts shown inside the app, such
// as a booking request or a new message. They are Firestore documents the app
// listens to in real time, so no push notification service is needed.
// Owner: Member 4.   Replaces: src/data/mockNotifications.jsx
//
// Not the same thing as the session reminders in ScheduleScreen, which are
// local notifications scheduled with expo-notifications on the device.
// Types are in src/constants/statuses.js (NOTIFICATION_TYPES).
import { notImplemented } from './notImplemented';

/**
 * Create a notification for one user.
 * @param {{ recipientId: string, type: string, title: string, message: string, data?: object }} notification
 * @returns {Promise<string>} the new notification id
 */
export async function createNotification(notification) {
  throw notImplemented('notificationService.createNotification', 'Member 4');
}

/**
 * Live list of a user's notifications for the bell and the notifications
 * screen, newest first. The callback receives the list; the bell can count the
 * ones where read is false.
 * @param {string} userId
 * @param {(notifications: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToNotifications(userId, callback) {
  throw notImplemented('notificationService.subscribeToNotifications', 'Member 4');
}

/** @param {string} notificationId @returns {Promise<void>} */
export async function markNotificationRead(notificationId) {
  throw notImplemented('notificationService.markNotificationRead', 'Member 4');
}

/** @param {string} userId @returns {Promise<void>} */
export async function markAllNotificationsRead(userId) {
  throw notImplemented('notificationService.markAllNotificationsRead', 'Member 4');
}

/**
 * Week 3. Which kinds of alerts the user wants (for example bookings, messages,
 * reminders). Saved on the user document.
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getNotificationPreferences(userId) {
  throw notImplemented('notificationService.getNotificationPreferences', 'Member 4');
}

/**
 * @param {string} userId
 * @param {object} preferences
 * @returns {Promise<void>}
 */
export async function updateNotificationPreferences(userId, preferences) {
  throw notImplemented('notificationService.updateNotificationPreferences', 'Member 4');
}
