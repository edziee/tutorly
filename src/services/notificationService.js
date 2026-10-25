// Firestore in-app alerts. These do not send operating-system push notifications.
import {
  collection, doc, documentId, getDocs, limit, onSnapshot, orderBy,
  query, runTransaction, serverTimestamp, startAfter, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { requireFirebase } from '../config/firebase';
import { notImplemented } from './notImplemented';
import { NOTIFICATION_TYPES } from '../constants/statuses';

function signedIn() {
  const firebase = requireFirebase();
  if (!firebase.auth.currentUser) throw new Error('Sign in to see notifications.');
  return { ...firebase, uid: firebase.auth.currentUser.uid };
}

export async function createNotification({ recipientId, type, title, message, data = {} }) {
  const { db } = signedIn();
  if (!recipientId || !Object.values(NOTIFICATION_TYPES).includes(type) ||
      typeof title !== 'string' || !title.trim() || typeof message !== 'string' || !message.trim()) {
    throw new Error('The notification is missing required details.');
  }
  // One message has one stable notification, including after retries. An
  // existing alert is left intact so retries never reset the recipient's read state.
  const id = type === NOTIFICATION_TYPES.NEW_MESSAGE && data.conversationId && data.messageId
    ? encodeURIComponent(JSON.stringify([data.conversationId, data.messageId]))
    : type === NOTIFICATION_TYPES.BOOKING_CANCELLED && data.bookingId && data.cancelledBy
      ? encodeURIComponent(JSON.stringify([type, data.bookingId, data.cancelledBy]))
      : null;
  const ref = id ? doc(db, 'notifications', id) : doc(collection(db, 'notifications'));
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      const saved = existing.data();
      if (
        saved.recipientId !== recipientId ||
        saved.type !== type ||
        saved.title !== title.trim() ||
        saved.message !== message.trim() ||
        (type === NOTIFICATION_TYPES.NEW_MESSAGE &&
          (saved.data?.conversationId !== data.conversationId ||
            saved.data?.messageId !== data.messageId)) ||
        (type === NOTIFICATION_TYPES.BOOKING_CANCELLED &&
          (saved.data?.bookingId !== data.bookingId ||
            saved.data?.cancelledBy !== data.cancelledBy))
      ) {
        throw new Error('This notification ID belongs to a different event.');
      }
      return;
    }
    transaction.set(ref, {
      recipientId, type, title: title.trim(), message: message.trim(), data,
      read: false, createdAt: serverTimestamp(),
    });
  });
  return ref.id;
}

export function subscribeToNotifications(userId, callback, onError = console.error) {
  const { db, uid } = signedIn();
  if (uid !== userId) throw new Error('You can only load your own notifications.');
  return onSnapshot(query(collection(db, 'notifications'), where('recipientId', '==', uid),
    orderBy('createdAt', 'desc')),
  (snapshot) => callback(
    snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
    { fromCache: snapshot.metadata.fromCache },
  ), onError);
}

export async function markNotificationRead(notificationId) {
  const { db } = signedIn();
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId) {
  return markMatchingNotificationsRead(userId);
}

export async function markConversationNotificationsRead(conversationId, userId) {
  return markMatchingNotificationsRead(userId, conversationId);
}

async function markMatchingNotificationsRead(userId, conversationId) {
  const { db, uid } = signedIn();
  if (uid !== userId) throw new Error('You can only update your own notifications.');
  // Paginate in document order so each write batch stays below 500 writes.
  let cursor;
  do {
    const constraints = [where('recipientId', '==', uid), orderBy(documentId()), limit(400)];
    if (cursor) constraints.push(startAfter(cursor));
    const snapshot = await getDocs(query(collection(db, 'notifications'), ...constraints));
    const batch = writeBatch(db);
    const unread = snapshot.docs.filter((item) => !item.data().read &&
      (!conversationId || item.data().data?.conversationId === conversationId));
    unread.forEach((item) => batch.update(item.ref, { read: true }));
    if (unread.length) await batch.commit();
    cursor = snapshot.size === 400 ? snapshot.docs.at(-1) : null;
  } while (cursor);
}

// Preferences remain the separate Week 3 task.
export async function getNotificationPreferences(userId) {
  throw notImplemented('notificationService.getNotificationPreferences', 'Member 4');
}

export async function updateNotificationPreferences(userId, preferences) {
  throw notImplemented('notificationService.updateNotificationPreferences', 'Member 4');
}
