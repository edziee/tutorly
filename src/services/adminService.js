// Data for the admin dashboard: users, verification reviews and bookings.
// Owner: Member 4.   Only a logged-in admin may use these. The real protection
// is the Firestore security rules written by Member 1 in Week 3, because
// anything in the app can be bypassed by someone with the app's code.
//
// Verification status values are in src/constants/statuses.js.
import { notImplemented } from './notImplemented';

/**
 * @param {{ role?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getUsers(filters = {}) {
  throw notImplemented('adminService.getUsers', 'Member 4');
}

/**
 * Live list of tutors and professional tutors waiting for review
 * (verificationStatus is 'pending').
 * @param {(pending: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToPendingVerifications(callback) {
  throw notImplemented('adminService.subscribeToPendingVerifications', 'Member 4');
}

/**
 * Approve or reject a tutor or professional. Also creates the
 * 'verification_approved' or 'verification_rejected' notification for them
 * (Week 3).
 * @param {string} tutorId
 * @param {'approved'|'rejected'} status
 * @param {{ reviewerId: string, reason?: string }} review
 * @returns {Promise<void>}
 */
export async function setVerificationStatus(tutorId, status, review) {
  throw notImplemented('adminService.setVerificationStatus', 'Member 4');
}

/**
 * Overview of all bookings for the admin dashboard.
 * @returns {Promise<object[]>}
 */
export async function getBookingsOverview() {
  throw notImplemented('adminService.getBookingsOverview', 'Member 4');
}
