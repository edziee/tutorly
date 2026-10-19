// Tutor profiles (tutors/{uid}): the list students search, and the tutor's own
// application and verification data. See docs/FIRESTORE_SCHEMA.md.
//
// Two owners share this file, so keep your functions together and pull often:
//   Member 2: getTutors, getTutorById   (replaces src/data/mockTutors.jsx)
//   Member 1: getTutorApplication, saveTutorApplication
//             (replaces src/data/mockMentorApplication.jsx)
import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { TUTOR_TIERS, TUTOR_TYPES } from '../constants/statuses';
import { getTutorApplicationEvidenceError } from '../utils/validation';

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
  if (!uid) throw new Error('getTutorApplication needs a uid.');

  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.TUTORS, uid));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id, uid: snapshot.id } : null;
}

/**
 * Save the application and set verificationStatus to 'pending' so it shows up
 * in the admin's review list. Save proof metadata and a Google Drive sharing
 * URL only; do not upload proof files to Firebase Storage on the Spark plan.
 * @param {string} uid
 * @param {object} application
 * @returns {Promise<void>}
 */
export async function saveTutorApplication(uid, application) {
  if (!uid) throw new Error('saveTutorApplication needs a uid.');
  if (!application || !Array.isArray(application.courses)) {
    throw new Error('saveTutorApplication needs application details and courses.');
  }
  const evidenceError = getTutorApplicationEvidenceError(application);
  if (evidenceError) throw new Error(evidenceError);
  if (!Object.values(TUTOR_TIERS).includes(application.tier)) {
    throw new Error('Choose a valid tutor category before saving the application.');
  }

  const courses = application.courses.map((course) => {
    const id = (course.id ?? '').trim();
    const code = (course.code ?? '').trim();
    const title = (course.title ?? '').trim();
    const grade = (course.grade ?? '').trim();
    const courseDetails = {
      id,
      code,
      title,
      grade,
    };
    if (application.tutorType === TUTOR_TYPES.PEER) {
      courseDetails.proofName = course.proofName.trim();
      courseDetails.proofUrl = course.proofUrl.trim();
    }
    return courseDetails;
  });

  const { db } = requireFirebase();
  const tutorRef = doc(db, COLLECTIONS.TUTORS, uid);
  const existing = await getDoc(tutorRef);
  await setDoc(
    tutorRef,
    {
      name: (application.name ?? '').trim(),
      tutorType: application.tutorType,
      tier: application.tier,
      credentials: (application.credentials ?? '').trim(),
      preferredDays: application.preferredDays ?? [],
      preferredTimeSlots: application.preferredTimeSlots ?? [],
      courses,
      applicationProofName: application.tutorType === TUTOR_TYPES.PROFESSIONAL
        ? application.applicationProofName.trim()
        : deleteField(),
      applicationProofUrl: application.tutorType === TUTOR_TYPES.PROFESSIONAL
        ? application.applicationProofUrl.trim()
        : deleteField(),
      teachingPhilosophy: (application.teachingPhilosophy ?? '').trim(),
      formats: application.formats ?? [],
      verificationStatus: 'pending',
      verificationNote: '',
      verificationReviewedBy: deleteField(),
      verificationReviewedAt: deleteField(),
      updatedAt: serverTimestamp(),
      ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );
}
