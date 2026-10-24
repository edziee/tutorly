import { ROLES } from '../constants/roles.js';

const studentTopUpFormUrl = process.env.EXPO_PUBLIC_STUDENT_TOKEN_TOPUP_FORM_URL ?? '';
const tutorCashOutFormUrl = process.env.EXPO_PUBLIC_TUTOR_TOKEN_CASHOUT_FORM_URL ?? '';

export function isSupportedGoogleFormUrl(value) {
  return /^https:\/\/(?:docs\.google\.com\/forms\/|forms\.gle\/)/i.test(value);
}

export function getTokenFormUrl(role) {
  const url = role === ROLES.STUDENT
    ? studentTopUpFormUrl
    : [ROLES.TUTOR, ROLES.PROFESSIONAL].includes(role)
      ? tutorCashOutFormUrl
      : '';
  return isSupportedGoogleFormUrl(url) ? url : '';
}
