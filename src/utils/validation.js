// Checks for the login and sign-up forms. Each function returns an error
// message to show under the field, or '' when the value is fine.
// These only catch typing mistakes early. The real checks happen in Firebase.

import { TUTOR_TIERS, TUTOR_TYPES } from '../constants/statuses.js';

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const email = (value ?? '').trim();
  if (!email) return 'Enter your email.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email, like name@tip.edu.ph.';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Enter your password.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return '';
}

// For the login screen: an existing account may have an older password, so only
// check that something was typed.
export function validatePasswordPresent(value) {
  return value ? '' : 'Enter your password.';
}

export function validateRequired(value, fieldName) {
  return (value ?? '').trim() ? '' : `Enter ${fieldName}.`;
}

export function isEligibleTutorGrade(value) {
  const grade = (value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(grade)) return false;
  const numericGrade = Number(grade);
  return numericGrade >= 1 && numericGrade <= 1.5;
}

export function getTutorCourseValidationError(tutorType, course) {
  if (!Object.values(TUTOR_TYPES).includes(tutorType)) {
    return 'Choose a valid tutor category before adding courses.';
  }
  if (!(course?.code ?? '').trim() || !(course?.title ?? '').trim()) {
    return 'Enter the course code and title.';
  }
  if (tutorType === TUTOR_TYPES.PEER) {
    if (!isEligibleTutorGrade(course.grade)) {
      return 'Peer tutors need a final grade from 1.00 to 1.50 for each course.';
    }
    if (!(course.proofName ?? '').trim()) {
      return 'Enter the title or type of proof for this course.';
    }
    if (!isGoogleDriveUrl(course.proofUrl)) {
      return 'Add an HTTPS sharing link from drive.google.com or docs.google.com for this course.';
    }
  }
  return '';
}

export function getTutorApplicationEvidenceError(application) {
  if (!Object.values(TUTOR_TYPES).includes(application?.tutorType)) {
    return 'Choose a valid tutor category before submitting.';
  }
  if (
    (application.tutorType === TUTOR_TYPES.PEER && application.tier !== TUTOR_TIERS.PEER) ||
    (application.tutorType === TUTOR_TYPES.PROFESSIONAL &&
      ![TUTOR_TIERS.ALUMNI, TUTOR_TIERS.PROFESSOR].includes(application.tier))
  ) {
    return 'Select a tutor profile category that matches your sign-up type.';
  }
  const courses = application.courses;
  if (!Array.isArray(courses) || courses.length === 0) {
    return 'Add at least one course you want to tutor.';
  }
  const ids = courses.map((course) => course.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    return 'Each course must have a unique ID. Remove and add the affected course again.';
  }
  for (const course of courses) {
    const courseError = getTutorCourseValidationError(application.tutorType, course);
    if (courseError) return courseError;
  }
  if (application.tutorType === TUTOR_TYPES.PROFESSIONAL) {
    if (!(application.applicationProofName ?? '').trim()) {
      return 'Describe the proof you are submitting for your application.';
    }
    if (!isGoogleDriveUrl(application.applicationProofUrl)) {
      return 'Add an HTTPS Google Drive or Docs link for your application proof.';
    }
  }
  return '';
}

export function isGoogleDriveUrl(value) {
  try {
    const url = new URL((value ?? '').trim());
    return (
      url.protocol === 'https:' &&
      ['drive.google.com', 'docs.google.com'].includes(url.hostname.toLowerCase()) &&
      url.pathname !== '/'
    );
  } catch {
    return false;
  }
}

export function isHttpsUrl(value) {
  try {
    const url = new URL((value ?? '').trim());
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}
