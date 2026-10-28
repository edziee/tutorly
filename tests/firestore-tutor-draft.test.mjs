import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  getFirestore,
  query,
  runTransaction,
  serverTimestamp,
  terminate,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  checkInToBooking,
  createBooking,
  getBookingById,
  rescheduleBooking,
  submitBookingRating,
  updateBookingStatus,
  updateBookingTimer,
} from '../src/services/bookingService.js';
import {
  awardStudentBadge,
  setStudentBadgeVisibility,
  setTutorAchievementVisibility,
} from '../src/services/badgeService.js';
import {
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
} from '../src/services/chatService.js';
import {
  markNotificationRead,
} from '../src/services/notificationService.js';
import { saveStudentLeaderboardStats } from '../src/services/studentLeaderboardService.js';
import { adjustWalletBalance, getAllWalletsForAdmin } from '../src/services/walletService.js';
import { SESSION_TIMER_ACTIONS } from '../src/utils/sessionTimer.js';
import {
  getTutors,
  saveTutorApplication,
  updateTutorBookingDetails,
} from '../src/services/tutorService.js';
import { createUserProfile, updateUserProfile } from '../src/services/userService.js';

const projectId = 'demo-tutorly-accounts-draft';
const firestoreRestUrl =
  `http://127.0.0.1:8280/v1/projects/${projectId}/databases/(default)/documents`;

async function createIdentity() {
  const app = initializeApp(
    { apiKey: 'local-only-key', projectId },
    `tutor-draft-${randomUUID()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9198', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8280);
  const email = `account-${randomUUID()}@example.test`;
  const credential = await createUserWithEmailAndPassword(auth, email, randomUUID());
  return { app, auth, db, email, uid: credential.user.uid };
}

function setCurrentIdentity(identity) {
  globalThis.__tutorlyTestFirebase = { auth: identity.auth, db: identity.db };
}

async function seedAdminAccount(identity) {
  const fields = {
    uid: { stringValue: identity.uid },
    email: { stringValue: identity.email },
    role: { stringValue: 'admin' },
    name: { stringValue: 'Test Admin' },
    campusId: { stringValue: '' },
    createdAt: { timestampValue: new Date().toISOString() },
  };
  const response = await fetch(`${firestoreRestUrl}:commit`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [{
        update: {
          name: `projects/${projectId}/databases/(default)/documents/users/${identity.uid}`,
          fields,
        },
      }],
    }),
  });
  assert.equal(response.ok, true, await response.text());
}

async function seedWalletBalance(identity, availableUnits) {
  const response = await fetch(`${firestoreRestUrl}:commit`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [{
        update: {
          name: `projects/${projectId}/databases/(default)/documents/wallets/${identity.uid}`,
          fields: {
            availableUnits: { integerValue: String(availableUnits) },
            heldUnits: { integerValue: '0' },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        },
      }],
    }),
  });
  assert.equal(response.ok, true, await response.text());
}

async function cleanup(identities) {
  for (const identity of identities) {
    await terminate(identity.db);
    await deleteApp(identity.app);
  }
}

test('tutor draft supports private applications, public approved profiles, and safe review', async (t) => {
  const student = await createIdentity();
  const other = await createIdentity();
  const admin = await createIdentity();
  const stranger = await createIdentity();
  t.after(() => cleanup([student, other, admin, stranger]));

  setCurrentIdentity(student);
  await createUserProfile(student.uid, {
    email: student.email,
    role: 'student',
    name: 'Test Student',
    campusId: 'CAMPUS-1',
  });
  setCurrentIdentity(other);
  await createUserProfile(other.uid, {
    email: other.email,
    role: 'student',
    name: 'Other Student',
    campusId: 'CAMPUS-2',
  });

  setCurrentIdentity(student);
  await saveTutorApplication(student.uid, {
    name: 'Test Peer Tutor',
    tutorType: 'peer',
    tier: 'Peer Tutor',
    credentials: '',
    preferredDays: ['Monday'],
    preferredTimeSlots: ['Morning'],
    courses: [{
      id: 'math-1',
      code: 'MATH 001',
      title: 'Algebra',
      grade: '1.00',
      proofName: 'Grade Slip',
      proofUrl: 'https://drive.google.com/file/d/test',
    }],
    teachingPhilosophy: '',
    formats: ['online'],
  });

  const privateApplication = await getDoc(doc(student.db, 'tutorApplications', student.uid));
  assert.equal(privateApplication.data().verificationStatus, 'pending');
  assert.equal(privateApplication.data().courses[0].proofName, 'Grade Slip');

  setCurrentIdentity(other);
  await assert.rejects(
    getDoc(doc(other.db, 'tutorApplications', student.uid)),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    getDoc(doc(other.db, 'tutors', student.uid)),
    { code: 'permission-denied' },
  );

  await assert.rejects(
    updateDoc(doc(student.db, 'tutors', student.uid), {
      homeAddress: 'Must not be stored in a public tutor profile',
    }),
    { code: 'permission-denied' },
  );

  await seedAdminAccount(admin);
  setCurrentIdentity(admin);
  const applicationRef = doc(admin.db, 'tutorApplications', student.uid);
  const tutorRef = doc(admin.db, 'tutors', student.uid);
  await runTransaction(admin.db, async (transaction) => {
    const [application, tutor] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(tutorRef),
    ]);
    assert.equal(application.data().verificationStatus, 'pending');
    assert.equal(tutor.data().verificationStatus, 'pending');
    transaction.update(applicationRef, {
      verificationStatus: 'approved',
      verificationNote: '',
      verificationReviewedBy: admin.uid,
      verificationReviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(tutorRef, {
      verificationStatus: 'approved',
      verificationNote: '',
      updatedAt: serverTimestamp(),
    });
  });

  setCurrentIdentity(other);
  const tutors = await getTutors();
  const approvedTutor = tutors.find((tutor) => tutor.id === student.uid);
  assert.ok(approvedTutor, 'approved public tutor should appear in discovery');
  assert.equal(Object.hasOwn(approvedTutor, 'homeAddress'), false);

  const publicProfile = await getDoc(doc(other.db, 'tutors', student.uid));
  assert.equal(publicProfile.data().verificationStatus, 'approved');
  assert.equal(Object.hasOwn(publicProfile.data(), 'courses'), false);
  assert.equal(Object.hasOwn(publicProfile.data(), 'homeAddress'), false);

  const reviewedApplication = await getDoc(doc(admin.db, 'tutorApplications', student.uid));
  assert.equal(reviewedApplication.data().verificationReviewedBy, admin.uid);

  setCurrentIdentity(student);
  await updateTutorBookingDetails(student.uid, { hourlyRate: 200 });
  await updateDoc(doc(student.db, 'tutors', student.uid), {
    online: true,
    lastSeenAt: serverTimestamp(),
  });
  await updateDoc(doc(student.db, 'tutors', student.uid), {
    location: 'North Campus',
    locationCell: { latitudeCell: 1400, longitudeCell: 12100 },
    locationCellVersion: 1,
    updatedAt: serverTimestamp(),
  });

  await updateUserProfile(student.uid, {
    location: 'South Campus',
    homeAddress: 'Updated private address',
  });
  const updatedTutor = await getDoc(doc(student.db, 'tutors', student.uid));
  assert.equal(updatedTutor.data().online, true);
  assert.equal(updatedTutor.data().hourlyRate, 200);
  assert.equal(Object.hasOwn(updatedTutor.data(), 'locationCell'), false);

  await seedWalletBalance(other, 50000);
  setCurrentIdentity(other);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateKey = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
  const bookingId = await createBooking({
    studentId: other.uid,
    studentName: 'Other Student',
    tutorId: student.uid,
    tutorName: 'Test Peer Tutor',
    tutorTier: 'Peer Tutor',
    subject: 'MATH 001: Algebra',
    dateKey,
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    durationHours: 1,
    location: 'Library',
    sessionMode: 'online',
    notes: '',
    totalAmount: 200,
    tutorPhotoUrl: '',
  });
  console.log('booking-created');
  assert.equal((await getBookingById(bookingId)).status, 'requested');

  const studentBookingQuery = query(
    collection(other.db, 'bookings'),
    where('studentId', '==', other.uid),
  );
  assert.equal((await getDocs(studentBookingQuery)).size, 1);
  console.log('booking-read-authorized');
  await assert.rejects(
    getDoc(doc(stranger.db, 'bookings', bookingId)),
    { code: 'permission-denied' },
  );
  assert.equal(
    (await getDoc(doc(other.db, 'wallets', student.uid))).exists(),
    true,
  );
  await assert.rejects(
    getDocs(collection(other.db, 'wallets')),
    { code: 'permission-denied' },
  );

  setCurrentIdentity(student);
  await updateBookingStatus(bookingId, 'upcoming');
  console.log('booking-accepted');
  assert.equal((await getBookingById(bookingId)).tokenStatus, 'reserved');
  setCurrentIdentity(other);
  assert.equal(
    (await getDoc(doc(other.db, 'wallets', other.uid))).data().heldUnits,
    16000,
  );

  const cancellationResult = await updateBookingStatus(bookingId, 'cancelled');
  console.log('booking-cancelled');
  assert.equal(cancellationResult.notificationError, null);
  assert.equal((await getBookingById(bookingId)).tokenStatus, 'refunded');
  const refundedWallet = (await getDoc(doc(other.db, 'wallets', other.uid))).data();
  assert.equal(refundedWallet.availableUnits, 50000);
  assert.equal(refundedWallet.heldUnits, 0);
  const refundHistory = await getDocs(query(
    collection(other.db, 'tokenTransactions'),
    where('accountId', '==', other.uid),
  ));
  assert.equal(
    refundHistory.docs.some((entry) => entry.data().type === 'booking_refund'),
    true,
  );

  setCurrentIdentity(other);
  const conversationId = await getOrCreateConversation(other.uid, student.uid);
  assert.equal(await getOrCreateConversation(other.uid, student.uid), conversationId);
  const sentMessage = await sendMessage(conversationId, {
    senderId: other.uid,
    text: 'Hello tutor',
    messageId: 'draft-chat-message',
  });
  assert.equal(sentMessage.notificationError, null);
  await sendMessage(conversationId, {
    senderId: other.uid,
    text: 'Hello tutor',
    messageId: 'draft-chat-message',
  });
  assert.equal(
    (await getDocs(collection(other.db, 'conversations', conversationId, 'messages'))).size,
    1,
  );
  await assert.rejects(
    getDoc(doc(stranger.db, 'conversations', conversationId)),
    { code: 'permission-denied' },
  );

  setCurrentIdentity(student);
  const messageAlerts = await getDocs(query(
    collection(student.db, 'notifications'),
    where('recipientId', '==', student.uid),
  ));
  const messageAlert = messageAlerts.docs
    .map((item) => ({ ...item.data(), id: item.id }))
    .find((item) => item.data?.conversationId === conversationId);
  assert.ok(messageAlert, 'the message notification should be delivered to the tutor');
  await markNotificationRead(messageAlert.id);
  await markConversationRead(conversationId, student.uid);
  assert.equal((await getDoc(doc(student.db, 'notifications', messageAlert.id))).data().read, true);
  assert.deepEqual((await getDoc(doc(student.db, 'conversations', conversationId))).data().unreadBy, []);
  await assert.rejects(
    getDoc(doc(stranger.db, 'notifications', messageAlert.id)),
    { code: 'permission-denied' },
  );

  setCurrentIdentity(other);
  await saveStudentLeaderboardStats(other.uid, {
    displayName: 'Other Student',
    badgeCount: 2,
    currentStreak: 4,
  });
  const leaderboard = await getDocs(collection(other.db, 'studentLeaderboard'));
  assert.equal(leaderboard.size, 1);
  await assert.rejects(
    saveStudentLeaderboardStats(student.uid, {
      displayName: 'Test Student',
      badgeCount: 1,
      currentStreak: 1,
    }),
    { code: 'permission-denied' },
  );
  await assert.rejects(
    getDocs(collection(stranger.db, 'studentLeaderboard')),
    { code: 'permission-denied' },
  );

  const secondBookingId = await createBooking({
    studentId: other.uid,
    studentName: 'Other Student',
    tutorId: student.uid,
    tutorName: 'Test Peer Tutor',
    tutorTier: 'Peer Tutor',
    subject: 'MATH 001: Algebra',
    dateKey,
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    durationHours: 1,
    location: 'Library',
    sessionMode: 'online',
    notes: '',
    totalAmount: 200,
    tutorPhotoUrl: '',
  });
  setCurrentIdentity(student);
  await updateBookingStatus(secondBookingId, 'upcoming');
  setCurrentIdentity(other);
  await rescheduleBooking(secondBookingId, {
    dateKey,
    startTime: '1:00 PM',
    endTime: '2:00 PM',
  });
  await checkInToBooking(secondBookingId, { latitude: 14.6, longitude: 121.0 });

  setCurrentIdentity(student);
  await updateBookingTimer(secondBookingId, SESSION_TIMER_ACTIONS.START);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await updateBookingTimer(secondBookingId, SESSION_TIMER_ACTIONS.STOP);
  const stoppedBooking = await getBookingById(secondBookingId);
  assert.equal(stoppedBooking.timerStatus, 'stopped');
  assert.ok(stoppedBooking.accumulatedDurationSeconds > 0);
  await updateBookingStatus(secondBookingId, 'completed');
  const completedBooking = await getBookingById(secondBookingId);
  assert.equal(completedBooking.status, 'completed');
  assert.equal(completedBooking.tokenStatus, 'settled');
  assert.equal(
    (await getDoc(doc(student.db, 'tokenTransactions', `${secondBookingId}_settlement_debit`))).exists(),
    true,
  );
  assert.equal(
    (await getDoc(doc(student.db, 'tokenTransactions', `${secondBookingId}_settlement_credit`))).exists(),
    true,
  );

  setCurrentIdentity(student);
  await awardStudentBadge({
    bookingId: secondBookingId,
    badgeId: 'curious_mind',
    note: 'Asked thoughtful questions.',
  });
  const badgeAwardRef = doc(
    student.db,
    'bookings',
    secondBookingId,
    'badgeAwards',
    'award',
  );
  assert.equal((await getDoc(badgeAwardRef)).data().studentId, other.uid);
  await assert.rejects(
    getDoc(doc(stranger.db, 'bookings', secondBookingId, 'badgeAwards', 'award')),
    { code: 'permission-denied' },
  );
  setCurrentIdentity(other);
  const studentBadgeAwards = await getDocs(query(
    collectionGroup(other.db, 'badgeAwards'),
    where('studentId', '==', other.uid),
  ));
  assert.equal(studentBadgeAwards.size, 1);
  await setStudentBadgeVisibility(secondBookingId, false);
  assert.equal(
    (await getDoc(doc(other.db, 'users', other.uid, 'studentBadgeVisibility', secondBookingId)))
      .data().visible,
    false,
  );
  await assert.rejects(
    getDoc(doc(
      stranger.db,
      'users',
      other.uid,
      'studentBadgeVisibility',
      secondBookingId,
    )),
    { code: 'permission-denied' },
  );

  setCurrentIdentity(student);
  const tutorAchievementRef = doc(
    student.db,
    'tutorAchievements',
    `${student.uid}_first_lesson`,
  );
  assert.equal((await getDoc(tutorAchievementRef)).exists(), true);
  setCurrentIdentity(stranger);
  await assert.rejects(
    getDoc(doc(stranger.db, 'tutorAchievements', `${student.uid}_first_lesson`)),
    { code: 'permission-denied' },
  );
  setCurrentIdentity(student);
  await setTutorAchievementVisibility('first_lesson', false);
  assert.equal(
    (await getDoc(doc(
      student.db,
      'users',
      student.uid,
      'tutorAchievementVisibility',
      'first_lesson',
    ))).data().visible,
    false,
  );

  setCurrentIdentity(other);
  await submitBookingRating(secondBookingId, 5, 'Helpful lesson', true);
  const ratedBooking = await getBookingById(secondBookingId);
  assert.equal(ratedBooking.rating, 5);
  assert.equal(ratedBooking.ratingAuthor, 'Anonymous');

  const rejectedBookingId = await createBooking({
    studentId: other.uid,
    studentName: 'Other Student',
    tutorId: student.uid,
    tutorName: 'Test Peer Tutor',
    tutorTier: 'Peer Tutor',
    subject: 'MATH 001: Algebra',
    dateKey,
    startTime: '3:00 PM',
    endTime: '4:00 PM',
    durationHours: 1,
    location: 'Library',
    sessionMode: 'online',
    notes: '',
    totalAmount: 200,
    tutorPhotoUrl: '',
  });
  setCurrentIdentity(student);
  await updateBookingStatus(rejectedBookingId, 'rejected');
  const rejectedBooking = await getBookingById(rejectedBookingId);
  assert.equal(rejectedBooking.status, 'rejected');
  assert.equal(rejectedBooking.tokenStatus, 'not_charged');

  await seedAdminAccount(admin);
  await seedWalletBalance(other, 50000);
  setCurrentIdentity(admin);
  await adjustWalletBalance(other.uid, {
    direction: 'credit',
    amountTokens: 5,
    reason: 'Emulator test credit',
    formReference: 'test-credit',
    operationId: 'draft-admin-credit',
  });
  await adjustWalletBalance(other.uid, {
    direction: 'debit',
    amountTokens: 2,
    reason: 'Emulator test debit',
    formReference: 'test-debit',
    operationId: 'draft-admin-debit',
  });
  assert.equal(
    (await getDoc(doc(admin.db, 'wallets', other.uid))).data().availableUnits,
    50300,
  );
  assert.ok((await getAllWalletsForAdmin()).some((wallet) => wallet.id === other.uid));
  assert.equal(
    (await getDoc(doc(admin.db, 'tokenTransactions', 'draft-admin-credit'))).data().type,
    'admin_credit',
  );
  setCurrentIdentity(other);
  await assert.rejects(
    getDocs(collection(other.db, 'wallets')),
    { code: 'permission-denied' },
  );
});
