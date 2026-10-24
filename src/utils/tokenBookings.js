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
