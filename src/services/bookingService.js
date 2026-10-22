// Bookings (bookings/{id}): requests, accepted sessions, QR payment reporting,
// rescheduling and check-in.
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS } from '../constants/statuses';
import { getBookingTimeError, parseTimeToMinutes } from '../utils/bookings';
import { isHttpsUrl } from '../utils/validation';

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
  const { db } = requireFirebase();
  const bookingRef = doc(collection(db, COLLECTIONS.BOOKINGS));
  await setDoc(bookingRef, {
    ...booking,
    status: BOOKING_STATUS.REQUESTED,
    paymentStatus: BOOKING_PAYMENT_STATUS.AWAITING_TUTOR_ACCEPTANCE,
    paymentReportedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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

export async function updateBookingStatus(bookingId, status) {
  requireText(bookingId, 'id');
  if (![BOOKING_STATUS.UPCOMING, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(status)) {
    throw new Error('Choose a valid booking status.');
  }
  const auth = requireAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Sign in to respond to this booking.');
  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    const isTutor = booking.tutorId === userId;
    const isStudent = booking.studentId === userId;
    let bookingUpdate = {};
    if (status === BOOKING_STATUS.UPCOMING || status === BOOKING_STATUS.REJECTED) {
      if (!isTutor || booking.status !== BOOKING_STATUS.REQUESTED) {
        throw new Error('Only the assigned tutor can respond to a pending request.');
      }
      if (status === BOOKING_STATUS.UPCOMING) {
        const tutorSnapshot = await transaction.get(
          doc(db, COLLECTIONS.TUTOR_APPLICATIONS, booking.tutorId),
        );
        const tutor = tutorSnapshot.exists() ? tutorSnapshot.data() : null;
        if (!tutor || !isHttpsUrl(tutor.paymentQrUrl)) {
          throw new Error('Add a valid HTTPS payment QR in your tutor workspace before accepting requests.');
        }
        bookingUpdate = {
          tutorQrUrl: tutor.paymentQrUrl,
          tutorPhotoUrl: tutor.photoUrl ?? '',
        };
      }
    } else if (status === BOOKING_STATUS.COMPLETED) {
      if (!isTutor || booking.status !== BOOKING_STATUS.UPCOMING) {
        throw new Error('Only the assigned tutor can complete an accepted session.');
      }
    } else if ((!isTutor && !isStudent) || ![BOOKING_STATUS.REQUESTED, BOOKING_STATUS.UPCOMING].includes(booking.status)) {
      throw new Error('Only a participant can cancel an active booking.');
    }
    if (
      status === BOOKING_STATUS.CANCELLED &&
      [BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION, BOOKING_PAYMENT_STATUS.SETTLED].includes(booking.paymentStatus)
    ) {
      throw new Error('Contact the tutor before cancelling after a payment has been reported or confirmed.');
    }

    transaction.update(bookingRef, {
      ...bookingUpdate,
      status,
      ...(status === BOOKING_STATUS.UPCOMING
        ? { paymentStatus: BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT }
        : {}),
      ...(status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED
        ? { paymentStatus: BOOKING_PAYMENT_STATUS.NOT_APPLICABLE }
        : {}),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function reportBookingPayment(bookingId, studentId) {
  requireText(bookingId, 'id');
  requireText(studentId, 'student');
  const auth = requireAuth();
  if (auth.currentUser?.uid !== studentId) {
    throw new Error('Sign in as the student who booked this session.');
  }
  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    if (booking.studentId !== studentId) throw new Error('Only the student who booked can report payment.');
    if (booking.status !== BOOKING_STATUS.UPCOMING) {
      throw new Error('Payment is available only after the tutor accepts the session.');
    }
    if (booking.paymentStatus !== BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT) {
      throw new Error('This booking is not waiting for a payment report.');
    }
    if (!isHttpsUrl(booking.tutorQrUrl)) {
      throw new Error('The tutor has not configured a valid payment QR yet.');
    }
    transaction.update(bookingRef, {
      paymentStatus: BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION,
      paymentReportedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function confirmBookingPayment(bookingId) {
  requireText(bookingId, 'id');
  const auth = requireAuth();
  const tutorId = auth.currentUser?.uid;
  if (!tutorId) throw new Error('Sign in as the tutor to verify this payment.');
  const { db } = requireFirebase();
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('This booking no longer exists.');
    const booking = snapshot.data();
    if (booking.tutorId !== tutorId) throw new Error('Only the assigned tutor can verify this payment.');
    if (![BOOKING_STATUS.UPCOMING, BOOKING_STATUS.COMPLETED].includes(booking.status) ||
      booking.paymentStatus !== BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION) {
      throw new Error('This booking has no payment report waiting for verification.');
    }
    transaction.update(bookingRef, {
      paymentStatus: BOOKING_PAYMENT_STATUS.SETTLED,
      paymentVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
    if (booking.paymentStatus !== BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT) {
      throw new Error('This session cannot be rescheduled after payment has been reported.');
    }
    const durationHours = (
      parseTimeToMinutes(newTime.endTime) - parseTimeToMinutes(newTime.startTime)
    ) / 60;
    const timeError = getBookingTimeError({ ...newTime, durationHours });
    if (timeError) throw new Error(timeError);
    transaction.update(bookingRef, {
      dateKey: newTime.dateKey,
      startTime: newTime.startTime,
      endTime: newTime.endTime,
      durationHours,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function markBookingPaid(bookingId, studentId) {
  return reportBookingPayment(bookingId, studentId);
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
