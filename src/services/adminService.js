// Admin-only Firestore reads and tutor verification reviews.
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { ROLES } from '../constants/roles';
import { VERIFICATION_STATUS } from '../constants/statuses';
import { isHttpsUrl } from '../utils/validation';

function requireSignedInAdmin() {
  const uid = requireAuth().currentUser?.uid;
  if (!uid) throw new Error('Sign in as an admin to use this feature.');
  return uid;
}

function toTutorApplication(snapshot) {
  const application = snapshot.data();
  const courses = Array.isArray(application.courses) ? application.courses : [];
  return {
    ...application,
    id: snapshot.id,
    subject: courses[0]
      ? [courses[0].code, courses[0].title].filter(Boolean).join(': ')
      : '',
  };
}

function toDirectTutorReview(snapshot) {
  const account = snapshot.data();
  return {
    id: snapshot.id,
    source: 'direct_signup',
    name: account.name || '',
    email: account.email || '',
    campusId: account.campusId || '',
    tutorType: account.tutorType || 'professional',
    tier: 'Direct tutor account',
    verificationStatus: account.tutorVerificationStatus,
    verificationNote: account.tutorVerificationNote || '',
    verificationReviewedBy: account.tutorVerificationReviewedBy,
    verificationReviewedAt: account.tutorVerificationReviewedAt,
    createdAt: account.createdAt,
    courses: [],
  };
}

function getLegacyApplicationFields(tutor) {
  const fields = [
    'name',
    'tutorType',
    'tier',
    'credentials',
    'preferredDays',
    'preferredTimeSlots',
    'courses',
    'applicationProofName',
    'applicationProofUrl',
    'teachingPhilosophy',
    'formats',
    'verificationStatus',
    'verificationNote',
    'createdAt',
    'updatedAt',
  ];
  const application = Object.fromEntries(
    fields.filter((field) => field in tutor).map((field) => [field, tutor[field]]),
  );
  if (!application.tutorType && application.tier) {
    application.tutorType = application.tier === 'Peer Tutor' ? 'peer' : 'professional';
  }
  if (isHttpsUrl(tutor.paymentQrUrl)) application.paymentQrUrl = tutor.paymentQrUrl;
  return application;
}

function toPublicCourseNames(courses) {
  return (Array.isArray(courses) ? courses : [])
    .map((course) => [course.code, course.title].filter(Boolean).join(': '))
    .join('\n');
}

function toPublicTutorProfile(tutor, status, reason, reviewedAt) {
  const courseNames = toPublicCourseNames(tutor.courses);
  const profile = {
    name: tutor.name || 'Tutor',
    tutorType: tutor.tutorType,
    tier: tutor.tier,
    credentials: tutor.credentials || '',
    preferredDays: tutor.preferredDays || [],
    preferredTimeSlots: tutor.preferredTimeSlots || [],
    courseNames,
    subject: courseNames.split('\n')[0] || '',
    teachingPhilosophy: tutor.teachingPhilosophy || '',
    formats: tutor.formats || [],
    verificationStatus: status,
    verificationNote: reason,
    publicProfileVersion: 2,
    createdAt: tutor.createdAt ?? reviewedAt,
    updatedAt: reviewedAt,
  };
  [
    'photoUrl',
    'location',
    'coordinates',
    'availability',
    'online',
    'rating',
    'reviewCount',
    'lastRatingBookingId',
    'hourlyRate',
    'bio',
    'subject',
  ].forEach((field) => {
    if (field in tutor) profile[field] = tutor[field];
  });
  return profile;
}

/**
 * List users for the admin dashboard. Tutor verification status is read from
 * the public tutor profile so the users list does not need private evidence.
 */
export async function getUsers(filters = {}) {
  requireSignedInAdmin();
  const { db } = requireFirebase();
  const usersRef = collection(db, COLLECTIONS.USERS);
  const usersQuery = filters.role
    ? query(usersRef, where('role', '==', filters.role))
    : usersRef;
  const [usersSnapshot, tutorsSnapshot] = await Promise.all([
    getDocs(usersQuery),
    getDocs(collection(db, COLLECTIONS.TUTORS)),
  ]);
  const tutorById = new Map(tutorsSnapshot.docs.map((tutor) => [tutor.id, tutor.data()]));
  return usersSnapshot.docs.map((user) => {
    const account = user.data();
    const verificationStatus = tutorById.get(user.id)?.verificationStatus
      ?? account.tutorVerificationStatus;
    return {
      ...account,
      id: user.id,
      ...(verificationStatus ? { verificationStatus } : {}),
    };
  });
}

/** Listen to applications that have completed admin review. */
export function subscribeToReviewedApplications(callback, onError) {
  requireSignedInAdmin();
  const { db } = requireFirebase();
  const reviewedStatuses = [VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED];
  let applications = null;
  let legacyTutors = null;
  let directAccounts = null;
  let stopped = false;
  let stopApplications = () => {};
  let stopLegacyTutors = () => {};
  let stopDirectAccounts = () => {};

  const reviewedAt = (application) =>
    application.verificationReviewedAt ?? application.updatedAt ?? null;
  const timestampValue = (timestamp) =>
    typeof timestamp?.toMillis === 'function' ? timestamp.toMillis() : 0;

  const emit = () => {
    if (applications === null || legacyTutors === null || directAccounts === null || stopped) return;
    const reviewedById = new Map(legacyTutors.map((item) => [item.id, item]));
    directAccounts.forEach((item) => reviewedById.set(item.id, item));
    applications.forEach((item) => reviewedById.set(item.id, item));
    callback(
      [...reviewedById.values()].sort((first, second) =>
        timestampValue(second.verificationReviewedAt ?? second.tutorVerificationReviewedAt ?? reviewedAt(second)) -
        timestampValue(first.verificationReviewedAt ?? first.tutorVerificationReviewedAt ?? reviewedAt(first)),
      ),
    );
  };

  const stop = () => {
    stopped = true;
    stopApplications();
    stopLegacyTutors();
    stopDirectAccounts();
  };

  const handleError = (error) => {
    if (stopped) return;
    stop();
    onError?.(error);
  };

  stopApplications = onSnapshot(
    query(
      collection(db, COLLECTIONS.TUTOR_APPLICATIONS),
      where('verificationStatus', 'in', reviewedStatuses),
    ),
    (snapshot) => {
      applications = snapshot.docs.map(toTutorApplication);
      emit();
    },
    handleError,
  );
  stopLegacyTutors = onSnapshot(
    query(
      collection(db, COLLECTIONS.TUTORS),
      where('verificationStatus', 'in', reviewedStatuses),
    ),
    (snapshot) => {
      legacyTutors = snapshot.docs.map(toTutorApplication);
      emit();
    },
    handleError,
  );
  stopDirectAccounts = onSnapshot(
    query(
      collection(db, COLLECTIONS.USERS),
      where('tutorVerificationStatus', 'in', reviewedStatuses),
    ),
    (snapshot) => {
      directAccounts = snapshot.docs
        .filter((account) => account.data().role === ROLES.TUTOR)
        .map(toDirectTutorReview);
      emit();
    },
    handleError,
  );
  return stop;
}

/**
 * Listen to new private applications and legacy pending tutor profiles.
 * Legacy profiles are included until they are migrated by resubmission/review.
 */
export function subscribeToPendingVerifications(callback, onError) {
  requireSignedInAdmin();
  const { db } = requireFirebase();
  let applications = null;
  let legacyTutors = null;
  let stopped = false;
  let stopApplications = () => {};
  let stopLegacyTutors = () => {};

  const emit = () => {
    if (applications === null || legacyTutors === null || stopped) return;
    const pendingById = new Map(legacyTutors.map((item) => [item.id, item]));
    applications.forEach((item) => pendingById.set(item.id, item));
    callback([...pendingById.values()]);
  };

  const stop = () => {
    stopped = true;
    stopApplications();
    stopLegacyTutors();
  };

  const handleError = (error) => {
    if (stopped) return;
    stop();
    onError?.(error);
  };

  stopApplications = onSnapshot(
    query(
      collection(db, COLLECTIONS.TUTOR_APPLICATIONS),
      where('verificationStatus', '==', VERIFICATION_STATUS.PENDING),
    ),
    (snapshot) => {
      applications = snapshot.docs.map(toTutorApplication);
      emit();
    },
    handleError,
  );
  stopLegacyTutors = onSnapshot(
    query(
      collection(db, COLLECTIONS.TUTORS),
      where('verificationStatus', '==', VERIFICATION_STATUS.PENDING),
    ),
    (snapshot) => {
      legacyTutors = snapshot.docs.map(toTutorApplication);
      emit();
    },
    handleError,
  );
  return stop;
}

/**
 * Review an application. Legacy evidence is copied to the private collection
 * before it is removed from the public tutor profile.
 */
export async function setVerificationStatus(tutorId, status, review = {}) {
  if (!tutorId) throw new Error('A tutor id is required to review an application.');
  if (![VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED].includes(status)) {
    throw new Error('Choose approved or rejected as the verification status.');
  }
  const reviewerId = requireSignedInAdmin();
  if (review.reviewerId !== reviewerId) {
    throw new Error('The signed-in admin must be the reviewer.');
  }
  if (reviewerId === tutorId) {
    throw new Error('Admins cannot review their own tutor applications.');
  }
  const reason = typeof review.reason === 'string' ? review.reason.trim() : '';
  if (status === VERIFICATION_STATUS.REJECTED && !reason) {
    throw new Error('A reason is required when rejecting an application.');
  }

  const { db } = requireFirebase();
  const tutorRef = doc(db, COLLECTIONS.TUTORS, tutorId);
  const applicationRef = doc(db, COLLECTIONS.TUTOR_APPLICATIONS, tutorId);
  const userRef = doc(db, COLLECTIONS.USERS, tutorId);
  await runTransaction(db, async (transaction) => {
    const [tutorSnapshot, applicationSnapshot, userSnapshot] = await Promise.all([
      transaction.get(tutorRef),
      transaction.get(applicationRef),
      transaction.get(userRef),
    ]);
    if (!tutorSnapshot.exists()) throw new Error('This tutor profile no longer exists.');

    const tutor = tutorSnapshot.data();
    const application = applicationSnapshot.exists()
      ? applicationSnapshot.data()
      : getLegacyApplicationFields(tutor);
    if (application.verificationStatus !== VERIFICATION_STATUS.PENDING) {
      throw new Error('This application is no longer waiting for review.');
    }

    const timestamp = serverTimestamp();
    const publicProfile = toPublicTutorProfile(
      { ...tutor, ...application },
      status,
      reason,
      timestamp,
    );

    if (
      userSnapshot.exists() &&
      userSnapshot.data().role === ROLES.TUTOR &&
      userSnapshot.data().tutorVerificationStatus !== status
    ) {
      transaction.update(userRef, {
        tutorVerificationStatus: status,
        tutorVerificationNote: reason,
        tutorVerificationReviewedBy: reviewerId,
        tutorVerificationReviewedAt: timestamp,
        updatedAt: timestamp,
      });
    }

    transaction.set(
      applicationRef,
      {
        ...application,
        verificationStatus: status,
        verificationNote: reason,
        verificationReviewedBy: reviewerId,
        verificationReviewedAt: timestamp,
        updatedAt: timestamp,
        ...(!application.createdAt
          ? { createdAt: tutor.createdAt ?? timestamp }
          : {}),
      },
      { merge: true },
    );
    transaction.set(tutorRef, publicProfile);
  });
}

/**
 * Move existing approved tutor evidence out of public tutor documents before
 * role-based rules are published. Each tutor is migrated independently.
 * @returns {Promise<number>} number of profiles migrated
 */
export async function migrateLegacyApprovedTutors() {
  const reviewerId = requireSignedInAdmin();
  const { db } = requireFirebase();
  const tutorsSnapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.TUTORS),
      where('verificationStatus', '==', VERIFICATION_STATUS.APPROVED),
    ),
  );
  const privateProfileFields = [
    'courses',
    'applicationProofName',
    'applicationProofUrl',
    'paymentQrUrl',
    'verificationReviewedBy',
    'verificationReviewedAt',
  ];
  const legacyTutors = tutorsSnapshot.docs.filter((snapshot) => {
    const profile = snapshot.data();
    return profile.publicProfileVersion !== 2 ||
      privateProfileFields.some((field) => field in profile);
  });
  let migrated = 0;

  for (const tutorSnapshot of legacyTutors) {
    const tutorId = tutorSnapshot.id;
    const tutorRef = doc(db, COLLECTIONS.TUTORS, tutorId);
    const applicationRef = doc(db, COLLECTIONS.TUTOR_APPLICATIONS, tutorId);
    const wasMigrated = await runTransaction(db, async (transaction) => {
      const [currentTutorSnapshot, applicationSnapshot, userSnapshot] = await Promise.all([
        transaction.get(tutorRef),
        transaction.get(applicationRef),
        transaction.get(doc(db, COLLECTIONS.USERS, tutorId)),
      ]);
      if (!currentTutorSnapshot.exists()) return false;
      const currentTutor = currentTutorSnapshot.data();
      if (
        currentTutor.verificationStatus !== VERIFICATION_STATUS.APPROVED ||
        (currentTutor.publicProfileVersion === 2 &&
          !privateProfileFields.some((field) => field in currentTutor))
      ) {
        return false;
      }
      const user = userSnapshot.exists() ? userSnapshot.data() : null;
      if (!user || !['tutor', 'professional'].includes(user.role)) {
        throw new Error(`Cannot migrate tutor ${tutorId}: matching tutor account is missing.`);
      }

      const existingApplication = applicationSnapshot.exists()
        ? applicationSnapshot.data()
        : getLegacyApplicationFields(currentTutor);
      if (existingApplication.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
        throw new Error(`Cannot migrate tutor ${tutorId}: application is not approved.`);
      }

      const timestamp = serverTimestamp();
      const application = {
        ...existingApplication,
        tutorType: existingApplication.tutorType
          || user.tutorType
          || (user.role === 'professional' ? 'professional' : undefined),
        verificationStatus: VERIFICATION_STATUS.APPROVED,
        verificationNote: existingApplication.verificationNote || '',
        verificationReviewedBy: reviewerId,
        verificationReviewedAt: timestamp,
        createdAt: existingApplication.createdAt ?? currentTutor.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      const publicProfile = toPublicTutorProfile(
        { ...currentTutor, ...application },
        VERIFICATION_STATUS.APPROVED,
        application.verificationNote,
        timestamp,
      );

      transaction.set(applicationRef, application);
      transaction.set(tutorRef, publicProfile);
      return true;
    });
    if (wasMigrated) migrated += 1;
  }

  return migrated;
}

/** Return all bookings for the admin dashboard. */
export async function getBookingsOverview() {
  requireSignedInAdmin();
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
  return snapshot.docs.map((booking) => ({ ...booking.data(), id: booking.id }));
}
