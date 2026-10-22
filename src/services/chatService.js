// Chat writes are committed before their best-effort in-app notification.
import {
  arrayRemove, collection, doc, getDoc, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { requireFirebase } from '../config/firebase';
import { createNotification, markConversationNotificationsRead } from './notificationService';

function signedIn() {
  const firebase = requireFirebase();
  if (!firebase.auth.currentUser) throw new Error('Sign in to use chat.');
  return { ...firebase, uid: firebase.auth.currentUser.uid };
}

export function subscribeToConversations(userId, callback, onError = console.error) {
  const { db, uid } = signedIn();
  if (uid !== userId) throw new Error('You can only load your own conversations.');
  return onSnapshot(query(collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid), orderBy('lastMessageAt', 'desc')),
  (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))), onError);
}

export function subscribeToMessages(conversationId, callback, onError = console.error) {
  const { db } = signedIn();
  return onSnapshot(query(collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')),
  (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))), onError);
}

export async function getOrCreateConversation(studentId, tutorId) {
  const { auth, db, uid } = signedIn();
  if (!studentId || !tutorId || studentId === tutorId || ![studentId, tutorId].includes(uid)) {
    throw new Error('Choose a student and a different tutor for this chat.');
  }
  const id = encodeURIComponent(JSON.stringify([studentId, tutorId]));
  const ref = doc(db, 'conversations', id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return;
    if (uid !== studentId) throw new Error('A student must start a new conversation.');
    const [tutor, student] = await Promise.all([
      transaction.get(doc(db, 'tutors', tutorId)), transaction.get(doc(db, 'users', studentId)),
    ]);
    if (!tutor.exists()) throw new Error('This tutor profile is not available.');
    transaction.set(ref, {
      studentId, tutorId, participantIds: [studentId, tutorId],
      studentName: student.data()?.name || auth.currentUser.displayName || 'Student',
      tutorName: tutor.data().name || 'Tutor', tutorTier: tutor.data().tier || 'Peer Tutor',
      lastMessage: '', lastMessageAt: serverTimestamp(), unreadBy: [],
    });
  });
  return id;
}

/** Returns a notificationError when the message saved but its alert failed.
 * Pass a stable messageId when retrying a send to avoid duplicate messages.
 */
export async function sendMessage(conversationId, { senderId, text, messageId }) {
  const { db, uid } = signedIn();
  if (senderId !== uid) throw new Error('The sender must be the signed-in user.');
  const content = typeof text === 'string' ? text.trim() : '';
  if (!content || content.length > 4000) throw new Error('Write a message of 1–4,000 characters.');
  if (messageId && (typeof messageId !== 'string' || messageId.includes('/'))) {
    throw new Error('Invalid message ID.');
  }
  const conversationRef = doc(db, 'conversations', conversationId);
  const messageRef = messageId
    ? doc(db, 'conversations', conversationId, 'messages', messageId)
    : doc(collection(db, 'conversations', conversationId, 'messages'));
  const conversation = await runTransaction(db, async (transaction) => {
    const [chat, previous] = await Promise.all([
      transaction.get(conversationRef), transaction.get(messageRef),
    ]);
    if (!chat.exists() || !chat.data().participantIds.includes(uid)) {
      throw new Error('This conversation is not available to you.');
    }
    if (previous.exists()) {
      if (previous.data().senderId !== uid || previous.data().text !== content) {
        throw new Error('This message ID is already in use.');
      }
      return chat.data();
    }
    const recipientId = chat.data().participantIds.find((id) => id !== uid);
    transaction.set(messageRef, { senderId: uid, text: content, createdAt: serverTimestamp() });
    transaction.update(conversationRef, {
      lastMessage: content, lastMessageAt: serverTimestamp(), unreadBy: [recipientId],
    });
    return chat.data();
  });
  const recipientId = conversation.participantIds.find((id) => id !== uid);
  try {
    await createNotification({
      recipientId, type: 'new_message', title: 'New message', message: content,
      data: { conversationId, messageId: messageRef.id },
    });
    return { messageId: messageRef.id, notificationError: null };
  } catch (notificationError) {
    // Do not reject a successfully saved message or encourage sending it again.
    return { messageId: messageRef.id, notificationError };
  }
}

export async function markConversationRead(conversationId, userId) {
  const { db, uid } = signedIn();
  if (uid !== userId) throw new Error('You can only mark your own messages read.');
  await updateDoc(doc(db, 'conversations', conversationId), { unreadBy: arrayRemove(uid) });
  await markConversationNotificationsRead(conversationId, uid);
}

export function subscribeToConversation(conversationId, callback, onError = console.error) {
  const { db } = signedIn();
  return onSnapshot(doc(db, 'conversations', conversationId), (snapshot) => {
    if (!snapshot.exists()) { onError(new Error('This conversation no longer exists.')); return; }
    callback({ ...snapshot.data(), id: snapshot.id });
  }, onError);
}

export function createMessageId(conversationId) {
  const { db } = signedIn();
  return doc(collection(db, 'conversations', conversationId, 'messages')).id;
}

export function subscribeToChatTutors(callback, onError = console.error) {
  const { db } = signedIn();
  return onSnapshot(query(collection(db, 'tutors'), where('verificationStatus', '==', 'approved')),
    (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))), onError);
}
