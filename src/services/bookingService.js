// Bookings (bookings/{id}): requesting, listing, rescheduling, paying for and
// checking in to a session. Status values are in src/constants/statuses.js.
// Owner: Member 2.   Replaces: src/data/mockSchedules.jsx and the device-only
// storage in ScheduleScreen (AsyncStorage).
//
// Member 4 listens to booking changes to create notifications, so call
// notificationService.createNotification after createBooking and
// updateBookingStatus (agree on who does it: either here or in the screen).
import { notImplemented } from './notImplemented';

/**
 * Student requests a session. Creates a booking with status 'requested'.
 * @param {{ studentId: string, tutorId: string, subject: string, dateKey: string, startTime: string, endTime: string, location?: string, notes?: string }} booking
 * @returns {Promise<string>} the new booking id
 */
export async function createBooking(booking) {
  throw notImplemented('bookingService.createBooking', 'Member 2');
}

/**
 * Live list of one student's bookings for the schedule screen.
 * @param {string} studentId
 * @param {(bookings: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToStudentBookings(studentId, callback) {
  throw notImplemented('bookingService.subscribeToStudentBookings', 'Member 2');
}

/**
 * Live list of one tutor's booking requests and sessions.
 * @param {string} tutorId
 * @param {(bookings: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToTutorBookings(tutorId, callback) {
  throw notImplemented('bookingService.subscribeToTutorBookings', 'Member 2');
}

/**
 * Accept, reject, cancel or complete a booking.
 * @param {string} bookingId
 * @param {'requested'|'upcoming'|'completed'|'rejected'|'cancelled'} status
 * @returns {Promise<void>}
 */
export async function updateBookingStatus(bookingId, status) {
  throw notImplemented('bookingService.updateBookingStatus', 'Member 2');
}

/**
 * @param {string} bookingId
 * @param {{ dateKey: string, startTime: string, endTime: string }} newTime
 * @returns {Promise<void>}
 */
export async function rescheduleBooking(bookingId, newTime) {
  throw notImplemented('bookingService.rescheduleBooking', 'Member 2');
}

/**
 * Simulated payment (Week 3): mark the booking as paid and set paymentStatus.
 * @param {string} bookingId
 * @returns {Promise<void>}
 */
export async function markBookingPaid(bookingId) {
  throw notImplemented('bookingService.markBookingPaid', 'Member 2');
}

/**
 * Save that the student checked in, with the time and the location used.
 * Call it only after locationService.isAtCampus returned true.
 * @param {string} bookingId
 * @param {{ latitude: number, longitude: number }} coordinates
 * @returns {Promise<void>}
 */
export async function checkInToBooking(bookingId, coordinates) {
  throw notImplemented('bookingService.checkInToBooking', 'Member 2');
}
