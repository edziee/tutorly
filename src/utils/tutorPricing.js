import { TUTOR_TYPES } from '../constants/statuses.js';

export const MINIMUM_TUTOR_RATES = {
  [TUTOR_TYPES.PEER]: 200,
  [TUTOR_TYPES.PROFESSIONAL]: 300,
};

export function getMinimumTutorRate(tutorType) {
  return Object.prototype.hasOwnProperty.call(MINIMUM_TUTOR_RATES, tutorType)
    ? MINIMUM_TUTOR_RATES[tutorType]
    : null;
}

export function getTutorRateError(tutorType, rate) {
  if (!Number.isFinite(rate) || rate <= 0) {
    return 'Enter a valid session token amount greater than zero.';
  }

  const minimumRate = getMinimumTutorRate(tutorType);
  if (minimumRate === null) {
    return 'Could not verify the minimum rate for this tutor type.';
  }
  if (rate < minimumRate) {
    const tutorLabel = tutorType === TUTOR_TYPES.PEER ? 'Peer tutors' : 'Professional tutors';
    return `${tutorLabel} must set a minimum session rate of ${minimumRate} tokens.`;
  }
  return '';
}
