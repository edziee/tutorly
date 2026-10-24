// Bookings (bookings/{id}): token reservations, session status, rescheduling,
// and check-in. Older peso/payment fields are retained only on legacy records.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import {
  BOOKING_PAYMENT_STATUS,
  BOOKING_STATUS,
  TOKEN_BOOKING_STATUS,
  TOKEN_TRANSACTION_TYPES,
} from '../constants/statuses';
import { assertApprovedTutor } from './tutorService';
import { bookingsOverlap, getBookingTimeError, parseTimeToMinutes } from '../utils/bookings';
import {
  acceptBookingTokens,
  assertBookingBalance,
  refundAcceptedBookingTokens,
  refundReservedTokens,
  settleAcceptedBookingTokens,
  settleReservedTokens,
  splitBookingTokens,
  tokenAmountUnitsFromPrice,
} from '../utils/tokenBookings';
import {
  calculateUpdatedTutorRating,
  getRatingInputError,
} from '../utils/ratings';
import {
  getRecordedSeconds,
  SESSION_TIMER_ACTIONS,
  SESSION_TIMER_STATUS,
  validateTimerTransition,
} from '../utils/sessionTimer';

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Booking ${field} is required.`);
  }
}

export async function createBooking(booking) {
  requireText(booking?.studentId, 'student');
  requireText(booking?.tutorId, 'tutor');
  requireText(booking?.tutorName, 'tutor name');
  requireText(booking?.studentName, 'student name');
  requireText(booking?.subject, 'subject');
  const timeError = getBookingTimeError(booking);
  if (timeError) throw new Error(timeError);
  requireText(booking?.location, 'location');
  requireText(booking?.sessionMode, 'session format');
  if (!Number.isFinite(booking?.totalAmount) || booking.totalAmount <= 0) {
    throw new Error('A valid session price is required.');
  }

  const auth = requireAuth();
  if (!auth.currentUser || auth.currentUser.uid !== booking.studentId) {
    throw new Error('Sign in as the student requesting this session.');
  }
  const tokenAmountUnits = tokenAmountUnitsFromPrice(booking.totalAmount);
  const { depositUnits } = splitBookingTokens(tokenAmountUnits);
  const { db } = requireFirebase();
  const walletRef = doc(db, COLLECTIONS.WALLETS, booking.studentId);
  const bookingRef = doc(collection(db, COLLECTIONS.BOOKINGS));
  const studentBookingsQuery = query(
    collection(db, COLLECTIONS.BOOKINGS),
    where('studentId', '==', booking.studentId),
    where('dateKey', '==', booking.dateKey),
  );
  const snapshot = await getDocs(studentBookingsQuery);
  const hasConflict = snapshot.docs.some((item) => {
    const existing = item.data();
    return (
      [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.UPCOMING].includes(existing.status) &&
      bookingsOverlap(booking, existing)
    );
  });
  if (hasConflict) {
    throw new Error('You already have a request or booking at an overlapping time.');
  }

  const timestamp = serverTimestamp();
  await runTransaction(db, async (transaction) => {
    const walletSnapshot = await transaction.get(walletRef);
    if (!walletSnapshot.exists()) {
      throw new Error('Your token wallet is unavailable. Open your wallet and try again.');
    }
    assertBookingBalance(walletSnapshot.data(), tokenAmountUnits);
    transaction.set(bookingRef, {
      ...booking,
      totalAmount: tokenAmountUnits / 100,
      tokenAmountUnits,
      tokenDepositUnits: depositUnits,
      tokenStatus: TOKEN_BOOKING_STATUS.PENDING,
      status: BOOKING_STATUS.REQUESTED,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
  return bookingRef.id;
}

export function subscribeToStudentBookings(studentId, callback, onError) {
  if (!studentId) throw new Error('subscribeToStudentBookings needs a student id.');
  const auth = requireAuth();
  if (auth.currentUser?.uid !== studentId) {
    throw new Error('Only the signed-in student can view their bookings.');
  }
  const { db } = requireFirebase();
  const bookingsQuery = query(
    collection(db, COLLECTIONS.BOOKINGS),
    where('studentId', '==', studentId),
  );
  return onSnapshot(
    bookingsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))),
    onError,
  );
}

export function subscribeToTutorBookings(tutorId, callback, onError) {
  if (!tutorId) throw new Error('subscribeToTutorBookings needs a tutor id.');
  const auth = requireAuth();
  if (auth.currentUser?.uid !== tutorId) {
    throw new Error('Only the signed-in tutor can view their booking requests.');
  }
  const { db } = requireFirebase();
  const bookingsQuery = query(
    collection(db, COLLECTIONS.BOOKINGS),
    where('tutorId', '==', tutorId),
  );
  return onSnapshot(
    bookingsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))),
    onError,
  );
}

export async function submitBookingRating(bookingId, rating, review, isAnonymous) {
  requireText(bookingId, 'id');
  const normalizedReview = typeof review === 'string' ? review.trim() : review;
  const inputError = getRatingInputError(rating, normalizedReview);
  if (inputError) throw new Error(inputError);
  if (typeof isAnonymous !== 'boolean') {
    throw new Error('Choose whether to submit this rating anonymously.');
  }

  const auth = requireAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Sign in as the student who booked this session.');

  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = bookingSnapshot.data();
    if (booking.studentId !== userId) {
      throw new Error('Only the student who booked this session can rate it.');
    }
    if (booking.status !== BOOKING_STATUS.COMPLETED) {
      throw new Error('Only completed sessions can be rated.');
    }
    if ('rating' in booking) {
      throw new Error('This session has already been rated.');
    }
    if (typeof booking.studentName !== 'string' || !booking.studentName.trim()) {
      throw new Error('The student name for this booking is unavailable.');
    }
    if (typeof booking.tutorId !== 'string' || !booking.tutorId) {
      throw new Error('The tutor for this booking is unavailable.');
    }

    const tutorRef = doc(db, COLLECTIONS.TUTORS, booking.tutorId);
    const tutorSnapshot = await transaction.get(tutorRef);
    if (!tutorSnapshot.exists()) throw new Error('This tutor profile is no longer available.');
    const tutor = tutorSnapshot.data();
    const reviewCount = tutor.reviewCount ?? 0;
    const aggregate = calculateUpdatedTutorRating(tutor.rating, reviewCount, rating);
    const timestamp = serverTimestamp();

    transaction.update(bookingRef, {
      rating,
      review: normalizedReview,
      ratingIsAnonymous: isAnonymous,
      ratingAuthor: isAnonymous ? 'Anonymous' : booking.studentName,
      ratingCreatedAt: timestamp,
      updatedAt: timestamp,
    });
    transaction.update(tutorRef, {
      ...aggregate,
      lastRatingBookingId: bookingId,
      updatedAt: timestamp,
    });
  });
}

export function subscribeToBooking(bookingId, callback, onError) {
  requireText(bookingId, 'id');
  const userId = requireAuth().currentUser?.uid;
  if (!userId) throw new Error('Sign in to view this booking.');
  const { db } = requireFirebase();
  return onSnapshot(
    doc(db, COLLECTIONS.BOOKINGS, bookingId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const booking = snapshot.data();
      if (booking.studentId !== userId && booking.tutorId !== userId) {
        onError?.(new Error('Only the student or tutor on this booking can view it.'));
        return;
      }
      callback({ ...booking, id: snapshot.id });
    },
    onError,
  );
}

export async function getBookingById(bookingId) {
  requireText(bookingId, 'id');
  const auth = requireAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Sign in to view this booking.');
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId));
  if (!snapshot.exists()) return null;
  const booking = snapshot.data();
  if (booking.studentId !== userId && booking.tutorId !== userId) {
    throw new Error('Only the student or tutor on this booking can view it.');
  }
  return { ...booking, id: snapshot.id };
}

export async function updateBookingTimer(bookingId, action) {
  requireText(bookingId, 'id');
  if (!Object.values(SESSION_TIMER_ACTIONS).includes(action)) {
    throw new Error('Choose a valid session timer action.');
  }
  const userId = requireAuth().currentUser?.uid;
  if (!userId) throw new Error('Sign in as the assigned tutor to use the timer.');
  await assertApprovedTutor(userId);

  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  if (action === SESSION_TIMER_ACTIONS.START || action === SESSION_TIMER_ACTIONS.RESUME) {
    const activeQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('tutorId', '==', userId),
    );
    const activeSessions = await getDocs(activeQuery);
    if (activeSessions.docs.some((snapshot) =>
      snapshot.id !== bookingId && snapshot.data().timerStatus === SESSION_TIMER_STATUS.RUNNING,
    )) {
      throw new Error('Stop or pause the other active session before starting this timer.');
    }
  }

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    if (booking.tutorId !== userId) {
      throw new Error('Only the assigned tutor can use this session timer.');
    }
    validateTimerTransition(booking, action);
    const now = Date.now();
    const recordedSeconds = getRecordedSeconds(booking, now);
    const history = Array.isArray(booking.timerActionHistory)
      ? booking.timerActionHistory.slice(-49)
      : [];
    history.push({
      action,
      recordedSeconds,
      clientRecordedAt: new Date(now).toISOString(),
    });
    const timestamp = serverTimestamp();
    const timerUpdate = {
      timerStatus: action === SESSION_TIMER_ACTIONS.START || action === SESSION_TIMER_ACTIONS.RESUME
        ? SESSION_TIMER_STATUS.RUNNING
        : action === SESSION_TIMER_ACTIONS.PAUSE
          ? SESSION_TIMER_STATUS.PAUSED
          : SESSION_TIMER_STATUS.STOPPED,
      accumulatedDurationSeconds: recordedSeconds,
      timerLastAction: action,
      timerLastActionAt: timestamp,
      timerActionHistory: history,
      updatedAt: timestamp,
      ...(action === SESSION_TIMER_ACTIONS.START || action === SESSION_TIMER_ACTIONS.RESUME
        ? { timerStartedAt: timestamp, timerPausedAt: null, timerStoppedAt: null }
        : action === SESSION_TIMER_ACTIONS.PAUSE
          ? { timerStartedAt: null, timerPausedAt: timestamp }
          : { timerStartedAt: null, timerStoppedAt: timestamp }),
    };
    transaction.update(bookingRef, timerUpdate);
  });
}

export async function updateBookingStatus(bookingId, status) {
  requireText(bookingId, 'id');
  if (![BOOKING_STATUS.UPCOMING, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(status)) {
    throw new Error('Choose a valid booking status.');
  }
  const auth = requireAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Sign in to respond to this booking.');
  if (status !== BOOKING_STATUS.CANCELLED) {
    await assertApprovedTutor(userId);
  }
  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  if (status === BOOKING_STATUS.UPCOMING) {
    const bookingSnapshot = await getDoc(bookingRef);
    if (!bookingSnapshot.exists()) throw new Error('This booking no longer exists.');
    const requestedBooking = bookingSnapshot.data();
    if (
      requestedBooking.tutorId !== userId ||
      requestedBooking.status !== BOOKING_STATUS.REQUESTED
    ) {
      throw new Error('Only the assigned tutor can respond to a pending request.');
    }
    const tutorBookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('tutorId', '==', requestedBooking.tutorId),
      where('dateKey', '==', requestedBooking.dateKey),
      where('status', '==', BOOKING_STATUS.UPCOMING),
    );
    const tutorBookings = await getDocs(tutorBookingsQuery);
    const hasConflict = tutorBookings.docs.some((item) =>
      item.id !== bookingId && bookingsOverlap(requestedBooking, item.data()),
    );
    if (hasConflict) {
      const error = new Error('A session already occupies this time.');
      error.code = 'booking/tutor-overlap';
      throw error;
    }
  }
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    const isTutor = booking.tutorId === userId;
    const isStudent = booking.studentId === userId;
    let tutorRef;
    let nextTeachingSeconds;
    if (status === BOOKING_STATUS.UPCOMING || status === BOOKING_STATUS.REJECTED) {
      if (!isTutor || booking.status !== BOOKING_STATUS.REQUESTED) {
        throw new Error('Only the assigned tutor can respond to a pending request.');
      }
    } else if (status === BOOKING_STATUS.COMPLETED) {
      if (!isTutor || booking.status !== BOOKING_STATUS.UPCOMING) {
        throw new Error('Only the assigned tutor can complete an accepted session.');
      }
      if (booking.timerStatus !== SESSION_TIMER_STATUS.STOPPED ||
          !Number.isSafeInteger(booking.accumulatedDurationSeconds) ||
          booking.accumulatedDurationSeconds <= 0) {
        throw new Error('Stop the timer and review a positive recorded teaching duration before confirming completion.');
      }
      tutorRef = doc(db, COLLECTIONS.TUTORS, booking.tutorId);
      const tutorSnapshot = await transaction.get(tutorRef);
      if (!tutorSnapshot.exists()) throw new Error('The tutor profile is unavailable.');
      const currentTeachingSeconds = tutorSnapshot.data().totalRecordedTeachingSeconds ?? 0;
      nextTeachingSeconds = currentTeachingSeconds + booking.accumulatedDurationSeconds;
      if (
        !Number.isSafeInteger(currentTeachingSeconds) ||
        currentTeachingSeconds < 0 ||
        !Number.isSafeInteger(nextTeachingSeconds)
      ) {
        throw new Error('The tutor teaching-time total is invalid. Contact support.');
      }
    } else if ((!isTutor && !isStudent) || ![BOOKING_STATUS.REQUESTED, BOOKING_STATUS.UPCOMING].includes(booking.status)) {
      throw new Error('Only a participant can cancel an active booking.');
    }

    if (booking.tokenStatus === TOKEN_BOOKING_STATUS.PENDING) {
      if (status === BOOKING_STATUS.UPCOMING) {
        const studentWalletRef = doc(db, COLLECTIONS.WALLETS, booking.studentId);
        const tutorWalletRef = doc(db, COLLECTIONS.WALLETS, booking.tutorId);
        const acceptanceRef = doc(
          db,
          COLLECTIONS.TOKEN_TRANSACTIONS,
          `${bookingId}_acceptance`,
        );
        const depositHoldRef = doc(
          db,
          COLLECTIONS.TOKEN_TRANSACTIONS,
          `${bookingId}_deposit_hold`,
        );
        const [studentWallet, tutorWallet, oldAcceptance, oldDepositHold] = await Promise.all([
          transaction.get(studentWalletRef),
          transaction.get(tutorWalletRef),
          transaction.get(acceptanceRef),
          transaction.get(depositHoldRef),
        ]);
        if (!studentWallet.exists() || !tutorWallet.exists()) {
          throw new Error('A booking wallet is unavailable. Contact support.');
        }
        if (oldAcceptance.exists() || oldDepositHold.exists()) {
          throw new Error('This booking acceptance has already been recorded.');
        }
        const accepted = acceptBookingTokens(
          studentWallet.data(),
          tutorWallet.data(),
          booking.tokenAmountUnits,
        );
        if (accepted.depositUnits !== booking.tokenDepositUnits) {
          throw new Error('The booking deposit is inconsistent. Contact support.');
        }
        const timestamp = serverTimestamp();
        transaction.update(studentWalletRef, {
          ...accepted.student,
          updatedAt: timestamp,
          lastTransactionId: acceptanceRef.id,
        });
        transaction.update(tutorWalletRef, {
          ...accepted.tutor,
          updatedAt: timestamp,
          lastTransactionId: depositHoldRef.id,
        });
        transaction.set(acceptanceRef, {
          type: TOKEN_TRANSACTION_TYPES.BOOKING_ACCEPTANCE,
          accountId: booking.studentId,
          amountUnits: booking.tokenAmountUnits,
          availableDelta: -booking.tokenAmountUnits,
          heldDelta: accepted.remainingUnits,
          actorUid: userId,
          reason: '20% session deposit charged; remaining tokens reserved until completion.',
          formReference: '',
          bookingId,
          createdAt: timestamp,
        });
        transaction.set(depositHoldRef, {
          type: TOKEN_TRANSACTION_TYPES.BOOKING_DEPOSIT_HOLD,
          accountId: booking.tutorId,
          amountUnits: accepted.depositUnits,
          availableDelta: 0,
          heldDelta: accepted.depositUnits,
          actorUid: userId,
          reason: '20% session deposit held until completion or cancellation.',
          formReference: '',
          bookingId,
          createdAt: timestamp,
        });
        transaction.update(bookingRef, {
          status,
          tokenStatus: TOKEN_BOOKING_STATUS.RESERVED,
          updatedAt: timestamp,
        });
        return;
      }
      if (status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED) {
        transaction.update(bookingRef, {
          status,
          tokenStatus: TOKEN_BOOKING_STATUS.NOT_CHARGED,
          updatedAt: serverTimestamp(),
        });
        return;
      }
      throw new Error('This booking has no accepted token reservation to move.');
    }

    if (booking.tokenStatus) {
      if (booking.tokenStatus !== TOKEN_BOOKING_STATUS.RESERVED) {
        throw new Error('This booking no longer has reserved tokens to move.');
      }
      const studentWalletRef = doc(db, COLLECTIONS.WALLETS, booking.studentId);
      const refundRef = doc(
        db,
        COLLECTIONS.TOKEN_TRANSACTIONS,
        `${bookingId}_refund`,
      );
      if (status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED) {
        if (Number.isSafeInteger(booking.tokenDepositUnits)) {
          const tutorWalletRef = doc(db, COLLECTIONS.WALLETS, booking.tutorId);
          const depositRefundRef = doc(
            db,
            COLLECTIONS.TOKEN_TRANSACTIONS,
            `${bookingId}_deposit_refund`,
          );
          const [wallet, tutorWallet, existingRefund, existingDepositRefund] = await Promise.all([
            transaction.get(studentWalletRef),
            transaction.get(tutorWalletRef),
            transaction.get(refundRef),
            transaction.get(depositRefundRef),
          ]);
          if (!wallet.exists() || !tutorWallet.exists()) {
            throw new Error('A booking wallet is unavailable. Contact support.');
          }
          if (existingRefund.exists() || existingDepositRefund.exists()) {
            throw new Error('This booking refund has already been recorded.');
          }
          const refunded = refundAcceptedBookingTokens(
            wallet.data(),
            tutorWallet.data(),
            booking.tokenAmountUnits,
            booking.tokenDepositUnits,
          );
          const timestamp = serverTimestamp();
          transaction.update(studentWalletRef, {
            ...refunded.student,
            updatedAt: timestamp,
            lastTransactionId: refundRef.id,
          });
          transaction.update(tutorWalletRef, {
            ...refunded.tutor,
            updatedAt: timestamp,
            lastTransactionId: depositRefundRef.id,
          });
          transaction.set(refundRef, {
            type: TOKEN_TRANSACTION_TYPES.BOOKING_REFUND,
            accountId: booking.studentId,
            amountUnits: booking.tokenAmountUnits,
            availableDelta: booking.tokenAmountUnits,
            heldDelta: -refunded.remainingUnits,
            actorUid: userId,
            reason: 'Cancelled session deposit refunded and remaining reservation released.',
            formReference: '',
            bookingId,
            createdAt: timestamp,
          });
          transaction.set(depositRefundRef, {
            type: TOKEN_TRANSACTION_TYPES.BOOKING_DEPOSIT_REFUND,
            accountId: booking.tutorId,
            amountUnits: booking.tokenDepositUnits,
            availableDelta: 0,
            heldDelta: -booking.tokenDepositUnits,
            actorUid: userId,
            reason: 'Held session deposit returned to the student after cancellation.',
            formReference: '',
            bookingId,
            createdAt: timestamp,
          });
        } else {
          const [wallet, existingRefund] = await Promise.all([
            transaction.get(studentWalletRef),
            transaction.get(refundRef),
          ]);
          if (!wallet.exists()) throw new Error('The student wallet is unavailable.');
          if (existingRefund.exists()) throw new Error('This booking refund has already been recorded.');
          const refundedWallet = refundReservedTokens(wallet.data(), booking.tokenAmountUnits);
          const timestamp = serverTimestamp();
          transaction.update(studentWalletRef, {
            ...refundedWallet,
            updatedAt: timestamp,
            lastTransactionId: refundRef.id,
          });
          transaction.set(refundRef, {
            type: TOKEN_TRANSACTION_TYPES.BOOKING_REFUND,
            accountId: booking.studentId,
            amountUnits: booking.tokenAmountUnits,
            availableDelta: booking.tokenAmountUnits,
            heldDelta: -booking.tokenAmountUnits,
            actorUid: userId,
            reason: status === BOOKING_STATUS.REJECTED
              ? 'Tutor rejected the booking request.'
              : 'Booking cancelled; reserved tokens returned.',
            formReference: '',
            bookingId,
            createdAt: timestamp,
          });
        }
      } else if (status === BOOKING_STATUS.COMPLETED) {
        const tutorWalletRef = doc(db, COLLECTIONS.WALLETS, booking.tutorId);
        const debitRef = doc(
          db,
          COLLECTIONS.TOKEN_TRANSACTIONS,
          `${bookingId}_settlement_debit`,
        );
        const creditRef = doc(
          db,
          COLLECTIONS.TOKEN_TRANSACTIONS,
          `${bookingId}_settlement_credit`,
        );
        const [studentWallet, tutorWallet, oldDebit, oldCredit] = await Promise.all([
          transaction.get(studentWalletRef),
          transaction.get(tutorWalletRef),
          transaction.get(debitRef),
          transaction.get(creditRef),
        ]);
        if (!studentWallet.exists() || !tutorWallet.exists()) {
          throw new Error('A booking wallet is unavailable. Contact support.');
        }
        if (oldDebit.exists() || oldCredit.exists()) {
          throw new Error('This booking settlement has already been recorded.');
        }
        const studentData = studentWallet.data();
        const tutorData = tutorWallet.data();
        const isSplitBooking = Number.isSafeInteger(booking.tokenDepositUnits);
        const settledWallets = isSplitBooking
          ? settleAcceptedBookingTokens(
              studentData,
              tutorData,
              booking.tokenAmountUnits,
              booking.tokenDepositUnits,
            )
          : {
              ...settleReservedTokens(studentData, tutorData, booking.tokenAmountUnits),
              remainingUnits: booking.tokenAmountUnits,
            };
        const timestamp = serverTimestamp();
        transaction.update(studentWalletRef, {
          ...settledWallets.student,
          updatedAt: timestamp,
          lastTransactionId: debitRef.id,
        });
        transaction.update(tutorWalletRef, {
          ...settledWallets.tutor,
          updatedAt: timestamp,
          lastTransactionId: creditRef.id,
        });
        transaction.set(debitRef, {
          type: TOKEN_TRANSACTION_TYPES.BOOKING_SETTLEMENT_DEBIT,
          accountId: booking.studentId,
          amountUnits: settledWallets.remainingUnits,
          availableDelta: 0,
          heldDelta: -settledWallets.remainingUnits,
          actorUid: userId,
          reason: 'Tokens transferred to tutor after session completion.',
          formReference: '',
          bookingId,
          createdAt: timestamp,
        });
        transaction.set(creditRef, {
          type: TOKEN_TRANSACTION_TYPES.BOOKING_SETTLEMENT_CREDIT,
          accountId: booking.tutorId,
          amountUnits: booking.tokenAmountUnits,
          availableDelta: booking.tokenAmountUnits,
          heldDelta: isSplitBooking ? -booking.tokenDepositUnits : 0,
          actorUid: userId,
          reason: 'Tokens received after session completion.',
          formReference: '',
          bookingId,
          createdAt: timestamp,
        });
        if (status === BOOKING_STATUS.COMPLETED) {
          transaction.update(tutorRef, {
            totalRecordedTeachingSeconds: nextTeachingSeconds,
            lastTeachingBookingId: bookingId,
            updatedAt: timestamp,
          });
        }
      }
      const tokenUpdates = {
        status,
        updatedAt: serverTimestamp(),
        ...(status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED
          ? { tokenStatus: TOKEN_BOOKING_STATUS.REFUNDED }
          : {}),
        ...(status === BOOKING_STATUS.COMPLETED
          ? { tokenStatus: TOKEN_BOOKING_STATUS.SETTLED }
          : {}),
      };
      transaction.update(bookingRef, tokenUpdates);
      return;
    }

    if (
      status === BOOKING_STATUS.CANCELLED &&
      [BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION, BOOKING_PAYMENT_STATUS.SETTLED].includes(booking.paymentStatus)
    ) {
      throw new Error('Contact the tutor before cancelling after a payment has been reported or confirmed.');
    }
    transaction.update(bookingRef, {
      status,
      ...(status === BOOKING_STATUS.UPCOMING
        ? { paymentStatus: BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT }
        : {}),
      ...(status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED
        ? { paymentStatus: BOOKING_PAYMENT_STATUS.NOT_APPLICABLE }
        : {}),
      updatedAt: serverTimestamp(),
    });
    if (status === BOOKING_STATUS.COMPLETED) {
      transaction.update(tutorRef, {
        totalRecordedTeachingSeconds: nextTeachingSeconds,
        lastTeachingBookingId: bookingId,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function rescheduleBooking(bookingId, newTime) {
  requireText(bookingId, 'id');
  requireText(newTime?.dateKey, 'date');
  requireText(newTime?.startTime, 'start time');
  requireText(newTime?.endTime, 'end time');
  const auth = requireAuth();
  const studentId = auth.currentUser?.uid;
  if (!studentId) throw new Error('Sign in to reschedule this booking.');
  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    if (booking.studentId !== studentId || booking.status !== BOOKING_STATUS.UPCOMING) {
      throw new Error('Only the student can reschedule an accepted session.');
    }
    if (booking.tokenStatus
      ? booking.tokenStatus !== TOKEN_BOOKING_STATUS.RESERVED
      : booking.paymentStatus !== BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT) {
      throw new Error('This session cannot be rescheduled after payment has been reported.');
    }
    const durationHours = (
      parseTimeToMinutes(newTime.endTime) - parseTimeToMinutes(newTime.startTime)
    ) / 60;
    const timeError = getBookingTimeError({ ...newTime, durationHours });
    if (timeError) throw new Error(timeError);
    const studentBookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('studentId', '==', studentId),
      where('dateKey', '==', newTime.dateKey),
    );
    const studentBookings = await getDocs(studentBookingsQuery);
    const hasConflict = studentBookings.docs.some((item) => {
      const existing = item.data();
      return (
        item.id !== bookingId &&
        [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.UPCOMING].includes(existing.status) &&
        bookingsOverlap(newTime, existing)
      );
    });
    if (hasConflict) {
      throw new Error('You already have a request or booking at an overlapping time.');
    }
    transaction.update(bookingRef, {
      dateKey: newTime.dateKey,
      startTime: newTime.startTime,
      endTime: newTime.endTime,
      durationHours,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function checkInToBooking(bookingId, coordinates) {
  requireText(bookingId, 'id');
  if (!Number.isFinite(coordinates?.latitude) || !Number.isFinite(coordinates?.longitude)) {
    throw new Error('Valid check-in coordinates are required.');
  }
  const { db } = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
    checkedInAt: serverTimestamp(),
    checkInCoordinates: coordinates,
    updatedAt: serverTimestamp(),
  });
}
