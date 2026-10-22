// Tutor profiles (tutors/{uid}): the list students search, and the tutor's own
// application and verification data. See docs/FIRESTORE_SCHEMA.md.
//
// Two owners share this file, so keep your functions together and pull often:
//   Member 2: getTutors, getTutorById   (replaces src/data/mockTutors.jsx)
//   Member 1: getTutorApplication, saveTutorApplication
//             (replaces src/data/mockMentorApplication.jsx)
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { TUTOR_TIERS, TUTOR_TYPES } from '../constants/statuses';
import { isHttpsUrl, getTutorApplicationEvidenceError } from '../utils/validation';

function toPublicTutor(snapshot) {
  const data = snapshot.data();
  const firstCourse = Array.isArray(data.courses) ? data.courses[0] : null;
  const courseSubjects = (data.courses ?? []).map((course) => ({
    code: course.code ?? '',
    title: course.title ?? '',
    id: course.id ?? '',
  }));
  const subject = firstCourse
    ? [firstCourse.code, firstCourse.title].filter(Boolean).join(': ')
    : '';

  return {
    ...data,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Tutor',
    id: snapshot.id,
    uid: snapshot.id,
    subject,
    courses: courseSubjects,
    availability: Array.isArray(data.availability) ? data.availability : [],
    preferredDays: Array.isArray(data.preferredDays) ? data.preferredDays : [],
    preferredTimeSlots: Array.isArray(data.preferredTimeSlots) ? data.preferredTimeSlots : [],
    formats: Array.isArray(data.formats) ? data.formats : [],
    photoUrl: data.photoUrl ?? '',
    rating: Number.isFinite(data.rating) ? data.rating : null,
    reviewCount: Number.isFinite(data.reviewCount) ? data.reviewCount : 0,
    hourlyRate: Number.isFinite(data.hourlyRate) ? data.hourlyRate : null,
    paymentQrUrl: data.paymentQrUrl ?? '',
  };
}

/**
 * Tutors for the list and the map. Only approved tutors are shown to students.
 * Filtering by tier and subject can be done here (query) or in the screen.
 * @param {{ tier?: string, subject?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getTutors(filters = {}) {
  const { db } = requireFirebase();
  const tutorsQuery = query(
    collection(db, COLLECTIONS.TUTORS),
    where('verificationStatus', '==', 'approved'),
  );
  const snapshot = await getDocs(tutorsQuery);
  const tutors = snapshot.docs.map(toPublicTutor);
  const tierFilter = filters.tier?.trim().toLowerCase();
  const subjectFilter = filters.subject?.trim().toLowerCase();
  return tutors.filter((tutor) =>
    (!tierFilter || tutor.tier?.toLowerCase().includes(tierFilter)) &&
    (!subjectFilter || tutor.subject.toLowerCase().includes(subjectFilter)),
  );
}

/**
 * @param {string} tutorId
 * @returns {Promise<object | null>}
 */
export async function getTutorById(tutorId) {
  if (!tutorId) throw new Error('getTutorById needs a tutor id.');
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.TUTORS, tutorId));
  return snapshot.exists() ? toPublicTutor(snapshot) : null;
}

export async function updateTutorBookingDetails(uid, { paymentQrUrl, hourlyRate } = {}) {
  if (!uid) throw new Error('updateTutorBookingDetails needs a tutor id.');
  const auth = requireAuth();
  if (auth.currentUser?.uid !== uid) {
    throw new Error('Only the signed-in tutor can change their payment details.');
  }
  if (typeof paymentQrUrl !== 'string') {
    throw new Error('Enter the public HTTPS link for your payment QR image, or leave it blank.');
  }
  const cleanQrUrl = paymentQrUrl.trim();
  if (cleanQrUrl && !isHttpsUrl(cleanQrUrl)) {
    throw new Error('The payment QR must be a valid HTTPS image URL.');
  }
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    throw new Error('Enter a session price greater than zero.');
  }

  const { db } = requireFirebase();
  await setDoc(
    doc(db, COLLECTIONS.TUTORS, uid),
    { paymentQrUrl: cleanQrUrl, hourlyRate, updatedAt: serverTimestamp() },
    { merge: true },
  );
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
