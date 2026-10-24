export const MAX_RATING_REVIEW_LENGTH = 1000;

export function getRatingInputError(rating, review) {
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    return 'Choose a rating from 0 to 5 stars.';
  }
  if (typeof review !== 'string' || review.length > MAX_RATING_REVIEW_LENGTH) {
    return `Your message must be ${MAX_RATING_REVIEW_LENGTH} characters or fewer.`;
  }
  return '';
}

export function calculateUpdatedTutorRating(currentRating, reviewCount, rating) {
  if (!Number.isInteger(reviewCount) || reviewCount < 0) {
    throw new Error('The tutor rating count is invalid.');
  }
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new Error('Choose a rating from 0 to 5 stars.');
  }
  if (reviewCount === 0) {
    return { rating, reviewCount: 1 };
  }
  if (!Number.isFinite(currentRating) || currentRating < 0 || currentRating > 5) {
    throw new Error('The tutor rating average is invalid.');
  }
  return {
    rating: (currentRating * reviewCount + rating) / (reviewCount + 1),
    reviewCount: reviewCount + 1,
  };
}
