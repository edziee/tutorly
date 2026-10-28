import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, collection, setDoc, updateDoc, serverTimestamp, terminate, query, where } from 'firebase/firestore';
import { getOrCreateConversation, sendMessage, markConversationRead, subscribeToChatTutors, subscribeToMessages } from '../src/services/chatService.js';
import { createNotification, subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from '../src/services/notificationService.js';

const projectId = 'demo-tutorly';
const restRoot = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const choose = (identity) => { globalThis.__tutorlyTestFirebase = identity; };
async function seed(path, values) {
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
    typeof value === 'boolean'
      ? { booleanValue: value }
      : typeof value === 'number'
        ? { integerValue: String(value) }
        : { stringValue: value }]));
  const response = await fetch(`${restRoot}:commit`, { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [{ update: { name: `projects/${projectId}/databases/(default)/documents/${path}`, fields } }] }) });
  assert.equal(response.ok, true, await response.text());
}
async function identity(role) {
  const app = initializeApp({ apiKey: 'local-only-key', projectId }, `${role}-${randomUUID()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `${role}-${randomUUID()}@example.test`;
  const password = randomUUID();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  await seed(`users/${uid}`, { role, name: `Test ${role}` });
  if (role === 'tutor') await seed(`tutors/${uid}`, {
    name: 'Test Tutor',
    tier: 'Peer Tutor',
    verificationStatus: 'approved',
    locationPrivacyVersion: 1,
    publicProfileVersion: 2,
  });
  if (role === 'tutor') await seed(`tutorApplications/${uid}`, { verificationStatus: 'approved' });
  return { app, auth, db, uid, email, password };
}
function firstSnapshot(subscribe, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { stop?.(); reject(new Error('Listener timed out')); }, 10000);
    let stop;
    stop = subscribe((items) => {
      if (predicate(items)) { clearTimeout(timer); stop?.(); resolve(items); }
    }, (error) => { clearTimeout(timer); stop?.(); reject(error); });
  });
}

test('chat alerts integrate with Firestore, read state, retries, and security rules', async (t) => {
  const student = await identity('student');
  const tutor = await identity('tutor');
  const outsider = await identity('student');
  t.after(async () => {
    for (const item of [student, tutor, outsider]) { await terminate(item.db); await deleteApp(item.app); }
  });
  choose(tutor);
  await updateDoc(doc(tutor.db, 'tutors', tutor.uid), {
    online: true,
    lastSeenAt: serverTimestamp(),
  });
  const activeTutors = await firstSnapshot(
    (next, error) => subscribeToChatTutors(next, error),
    (items) => items.some((item) => item.id === tutor.uid),
  );
  assert.equal(activeTutors.some((item) => item.id === tutor.uid), true);
  await updateDoc(doc(tutor.db, 'tutors', tutor.uid), {
    online: false,
    lastSeenAt: serverTimestamp(),
  });
  const offlineTutors = await firstSnapshot(
    (next, error) => subscribeToChatTutors(next, error),
    (items) => !items.some((item) => item.id === tutor.uid),
  );
  assert.equal(offlineTutors.some((item) => item.id === tutor.uid), false);

  choose(student);
  const conversationId = await getOrCreateConversation(student.uid, tutor.uid);
  assert.equal(await getOrCreateConversation(student.uid, tutor.uid), conversationId);

  const sent = await sendMessage(conversationId, { senderId: student.uid, text: 'Hello tutor', messageId: 'first-message' });
  assert.equal(sent.notificationError, null);
  choose(tutor);
  const alerts = await firstSnapshot((next, error) => subscribeToNotifications(tutor.uid, next, error), (items) => items.some((item) => item.data?.conversationId === conversationId));
  const alert = alerts.find((item) => item.data?.conversationId === conversationId);
  assert.equal(alert.type, 'new_message');
  assert.equal(alert.recipientId, tutor.uid);
  assert.equal(alert.title, 'New message from Test student');
  assert.equal(alert.message, 'Hello tutor');
  assert.equal(alert.read, false);
  await markConversationRead(conversationId, tutor.uid);
  assert.equal((await getDoc(doc(tutor.db, 'notifications', alert.id))).data().read, true);
  assert.deepEqual((await getDoc(doc(tutor.db, 'conversations', conversationId))).data().unreadBy, []);

  choose(student);
  await sendMessage(conversationId, { senderId: student.uid, text: 'Hello tutor', messageId: 'first-message' });
  assert.equal((await getDocs(collection(student.db, 'conversations', conversationId, 'messages'))).size, 1);
  choose(tutor);
  const deduped = await firstSnapshot((next, error) => subscribeToNotifications(tutor.uid, next, error), (items) => items.some((item) => item.id === alert.id));
  assert.equal(deduped.filter((item) => item.data?.conversationId === conversationId).length, 1);
  assert.equal(deduped.find((item) => item.id === alert.id).read, true, 'retry must not reset a read alert');

  const received = firstSnapshot((next, error) => subscribeToMessages(conversationId, next, error), (items) => items.some((item) => item.text === 'Tutor reply'));
  const reply = await sendMessage(conversationId, { senderId: tutor.uid, text: 'Tutor reply', messageId: 'reply' });
  assert.equal(reply.notificationError, null);
  await received;
  choose(student);
  const studentAlerts = await firstSnapshot((next, error) => subscribeToNotifications(student.uid, next, error), (items) => items.length > 0);
  assert.equal(studentAlerts.at(0).data.conversationId, conversationId);
  assert.equal(studentAlerts.at(0).title, 'New message from Test Tutor');
  await markAllNotificationsRead(student.uid);
  assert.equal((await getDoc(doc(student.db, 'notifications', studentAlerts.at(0).id))).data().read, true);

  await seed('bookings/cancelled-session', {
    studentId: student.uid,
    tutorId: tutor.uid,
    status: 'cancelled',
    cancelledBy: student.uid,
  });
  choose(student);
  const cancellationAlertId = await createNotification({
    recipientId: tutor.uid,
    type: 'booking_cancelled',
    title: 'Session cancelled',
    message: 'The student cancelled the session. No tokens were deducted.',
    data: { bookingId: 'cancelled-session', cancelledBy: student.uid },
  });
  choose(tutor);
  await firstSnapshot(
    (next, error) => subscribeToNotifications(tutor.uid, next, error),
    (items) => items.some((item) => item.id === cancellationAlertId),
  );
  await markNotificationRead(cancellationAlertId);
  choose(student);
  await createNotification({
    recipientId: tutor.uid,
    type: 'booking_cancelled',
    title: 'Session cancelled',
    message: 'The student cancelled the session. No tokens were deducted.',
    data: { bookingId: 'cancelled-session', cancelledBy: student.uid },
  });
  choose(tutor);
  assert.equal((await getDoc(doc(tutor.db, 'notifications', cancellationAlertId))).data().read, true);
  choose(student);
  await assert.rejects(setDoc(doc(student.db, 'notifications', 'forged-cancellation'), {
    recipientId: outsider.uid,
    type: 'booking_cancelled',
    title: 'Session cancelled',
    message: 'Fake cancellation',
    data: { bookingId: 'cancelled-session', cancelledBy: student.uid },
    read: false,
    createdAt: serverTimestamp(),
  }), /permission/i);

  await assert.rejects(sendMessage(conversationId, { senderId: tutor.uid, text: 'spoofed' }), /sender/);
  await assert.rejects(sendMessage(conversationId, { senderId: student.uid, text: '   ' }), /Write a message/);

  // Force an alert failure using an inaccessible pre-existing ID. The main
  // message must remain saved even when its best-effort alert is rejected.
  choose(student);
  const failedAlertId = encodeURIComponent(JSON.stringify([conversationId, 'alert-failure']));
  await seed(`notifications/${failedAlertId}`, {
    recipientId: outsider.uid, type: 'other', title: 'Unrelated', message: 'Unrelated',
  });
  const partial = await sendMessage(conversationId, { senderId: student.uid, text: 'Saved despite alert failure', messageId: 'alert-failure' });
  assert.ok(partial.notificationError);
  assert.equal((await getDoc(doc(student.db, 'conversations', conversationId, 'messages', 'alert-failure'))).data().text, 'Saved despite alert failure');

  choose(student);
  const bulkWrites = Array.from({ length: 405 }, (_, index) => ({ update: {
    name: `projects/${projectId}/databases/(default)/documents/notifications/bulk-${student.uid}-${index}`,
    fields: { recipientId: { stringValue: student.uid }, read: { booleanValue: false } },
  } }));
  const bulkResponse = await fetch(`${restRoot}:commit`, { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: bulkWrites }) });
  assert.equal(bulkResponse.ok, true);
  await markAllNotificationsRead(student.uid);
  const bulkAlerts = await getDocs(query(collection(student.db, 'notifications'), where('recipientId', '==', student.uid)));
  assert.ok(bulkAlerts.size >= 405);
  assert.ok(bulkAlerts.docs.every((item) => item.data().read === true), 'mark-all-read must cross a 400-document page boundary');

  choose(outsider);
  await assert.rejects(getDoc(doc(outsider.db, 'conversations', conversationId)), /permission/i);
  await assert.rejects(getDocs(collection(outsider.db, 'conversations', conversationId, 'messages')), /permission/i);
  await assert.rejects(firstSnapshot((next, error) => subscribeToMessages(conversationId, next, error), () => true), /permission/i);
  await assert.rejects(markNotificationRead(alert.id), /permission/i);
  await assert.rejects(setDoc(doc(outsider.db, 'notifications', 'forged'), {
    recipientId: tutor.uid, type: 'new_message', title: 'New message from Test student', message: 'Fake',
    data: { conversationId, messageId: 'first-message' }, read: false, createdAt: serverTimestamp(),
  }), /permission/i);
  choose(student);
  await assert.rejects(setDoc(doc(student.db, 'notifications', 'spoofed-sender'), {
    recipientId: tutor.uid,
    type: 'new_message',
    title: 'New message from Someone else',
    message: 'Hello tutor',
    data: { conversationId, messageId: 'first-message' },
    read: false,
    createdAt: serverTimestamp(),
  }), /permission/i);
  await assert.rejects(updateDoc(doc(outsider.db, 'users', outsider.uid), { role: 'admin' }), /permission/i);

});
