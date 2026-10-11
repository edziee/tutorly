// Tutor profiles (tutors/{uid}): the list students search, and the tutor's own
// application and verification data. See docs/FIRESTORE_SCHEMA.md.
//
// Two owners share this file, so keep your functions together and pull often:
//   Member 2: getTutors, getTutorById   (replaces src/data/mockTutors.jsx)
//   Member 1: getTutorApplication, saveTutorApplication
//             (replaces src/data/mockMentorApplication.jsx)
import { notImplemented } from './notImplemented';

/**
 * Tutors for the list and the map. Only approved tutors are shown to students.
 * Filtering by tier and subject can be done here (query) or in the screen.
 * @param {{ tier?: string, subject?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getTutors(filters = {}) {
  throw notImplemented('tutorService.getTutors', 'Member 2');
}

/**
 * @param {string} tutorId
 * @returns {Promise<object | null>}
 */
export async function getTutorById(tutorId) {
  throw notImplemented('tutorService.getTutorById', 'Member 2');
}

/**
 * The logged-in tutor's own application: credentials, preferred days and time
 * slots, courses with grades, teaching philosophy, verification status.
 * @param {string} uid
 * @returns {Promise<object | null>}
 */
export async function getTutorApplication(uid) {
  throw notImplemented('tutorService.getTutorApplication', 'Member 1');
}

/**
 * Save the application and set verificationStatus to 'pending' so it shows up
 * in the admin's review list. Proof files are uploaded with storageService.
 * @param {string} uid
 * @param {object} application
 * @returns {Promise<void>}
 */
export async function saveTutorApplication(uid, application) {
  throw notImplemented('tutorService.saveTutorApplication', 'Member 1');
}
