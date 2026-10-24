import { toTokenUnits } from './tokens.js';

function assertWallet(wallet) {
  if (
    !wallet ||
    !Number.isSafeInteger(wallet.availableUnits) ||
    wallet.availableUnits < 0 ||
    !Number.isSafeInteger(wallet.heldUnits) ||
    wallet.heldUnits < 0
  ) {
    throw new Error('The token wallet balance is invalid. Contact support.');
  }
}

export function splitBookingTokens(amountUnits) {
  if (!Number.isSafeInteger(amountUnits) || amountUnits < 5) {
    throw new Error('A booking must cost at least 0.05 tokens to split its deposit.');
  }
  const depositUnits = Math.round(amountUnits / 5);
  const remainingUnits = amountUnits - depositUnits;
  if (depositUnits <= 0 || remainingUnits <= 0) {
    throw new Error('The booking price cannot be split into a deposit and balance.');
  }
  return { depositUnits, remainingUnits };
}

export function acceptBookingTokens(studentWallet, tutorWallet, amountUnits) {
  assertWallet(studentWallet);
  assertWallet(tutorWallet);
  const { depositUnits, remainingUnits } = splitBookingTokens(amountUnits);
  if (studentWallet.availableUnits < amountUnits) {
    throw new Error('The student does not have enough available tokens for this booking.');
  }
  const studentHeldUnits = studentWallet.heldUnits + remainingUnits;
  const tutorHeldUnits = tutorWallet.heldUnits + depositUnits;
  if (!Number.isSafeInteger(studentHeldUnits) || !Number.isSafeInteger(tutorHeldUnits)) {
    throw new Error('This booking exceeds the supported wallet balance.');
  }
  return {
    depositUnits,
    remainingUnits,
    student: {
      availableUnits: studentWallet.availableUnits - amountUnits,
      heldUnits: studentHeldUnits,
    },
    tutor: {
      availableUnits: tutorWallet.availableUnits,
      heldUnits: tutorHeldUnits,
    },
  };
}

export function refundAcceptedBookingTokens(
  studentWallet,
  tutorWallet,
  amountUnits,
  depositUnits,
) {
  assertWallet(studentWallet);
  assertWallet(tutorWallet);
  const expected = splitBookingTokens(amountUnits);
  if (depositUnits !== expected.depositUnits) {
    throw new Error('The reserved booking deposit is inconsistent. Contact support.');
  }
  if (studentWallet.heldUnits < expected.remainingUnits || tutorWallet.heldUnits < depositUnits) {
    throw new Error('The reserved token balance is inconsistent. Contact support.');
  }
  const studentAvailableUnits = studentWallet.availableUnits + amountUnits;
  if (!Number.isSafeInteger(studentAvailableUnits)) {
    throw new Error('This refund exceeds the supported wallet balance.');
  }
  return {
    student: {
      availableUnits: studentAvailableUnits,
      heldUnits: studentWallet.heldUnits - expected.remainingUnits,
    },
    tutor: {
      availableUnits: tutorWallet.availableUnits,
      heldUnits: tutorWallet.heldUnits - depositUnits,
    },
    remainingUnits: expected.remainingUnits,
  };
}

export function settleAcceptedBookingTokens(
  studentWallet,
  tutorWallet,
  amountUnits,
  depositUnits,
) {
  assertWallet(studentWallet);
  assertWallet(tutorWallet);
  const expected = splitBookingTokens(amountUnits);
  if (depositUnits !== expected.depositUnits) {
    throw new Error('The reserved booking deposit is inconsistent. Contact support.');
  }
  if (studentWallet.heldUnits < expected.remainingUnits || tutorWallet.heldUnits < depositUnits) {
    throw new Error('The reserved token balance is inconsistent. Contact support.');
  }
  const tutorAvailableUnits = tutorWallet.availableUnits + amountUnits;
  if (!Number.isSafeInteger(tutorAvailableUnits)) {
    throw new Error('This settlement exceeds the supported wallet balance.');
  }
  return {
    student: {
      availableUnits: studentWallet.availableUnits,
      heldUnits: studentWallet.heldUnits - expected.remainingUnits,
    },
    tutor: {
      availableUnits: tutorAvailableUnits,
      heldUnits: tutorWallet.heldUnits - depositUnits,
    },
    remainingUnits: expected.remainingUnits,
  };
}

export function reserveTokens(wallet, amountUnits) {
  assertWallet(wallet);
  if (!Number.isSafeInteger(amountUnits) || amountUnits <= 0) {
    throw new Error('A valid token amount is required.');
  }
  if (wallet.availableUnits < amountUnits) {
    throw new Error('You do not have enough available tokens for this booking.');
  }
  const heldUnits = wallet.heldUnits + amountUnits;
  if (!Number.isSafeInteger(heldUnits)) {
    throw new Error('This booking exceeds the supported wallet balance.');
  }
  return {
    availableUnits: wallet.availableUnits - amountUnits,
    heldUnits,
  };
}

export function refundReservedTokens(wallet, amountUnits) {
  assertWallet(wallet);
  if (!Number.isSafeInteger(amountUnits) || amountUnits <= 0) {
    throw new Error('A valid token amount is required.');
  }
  if (wallet.heldUnits < amountUnits) {
    throw new Error('The reserved token balance is inconsistent. Contact support.');
  }
  const availableUnits = wallet.availableUnits + amountUnits;
  if (!Number.isSafeInteger(availableUnits)) {
    throw new Error('This refund exceeds the supported wallet balance.');
  }
  return {
    availableUnits,
    heldUnits: wallet.heldUnits - amountUnits,
  };
}

export function settleReservedTokens(studentWallet, tutorWallet, amountUnits) {
  assertWallet(studentWallet);
  assertWallet(tutorWallet);
  if (!Number.isSafeInteger(amountUnits) || amountUnits <= 0) {
    throw new Error('A valid token amount is required.');
  }
  if (studentWallet.heldUnits < amountUnits) {
    throw new Error('The reserved token balance is inconsistent. Contact support.');
  }
  const tutorAvailableUnits = tutorWallet.availableUnits + amountUnits;
  if (!Number.isSafeInteger(tutorAvailableUnits)) {
    throw new Error('This settlement exceeds the supported wallet balance.');
  }
  return {
    student: {
      availableUnits: studentWallet.availableUnits,
      heldUnits: studentWallet.heldUnits - amountUnits,
    },
    tutor: {
      availableUnits: tutorAvailableUnits,
      heldUnits: tutorWallet.heldUnits,
    },
  };
}

export function tokenAmountUnitsFromPrice(price) {
  return toTokenUnits(price);
}
