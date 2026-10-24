import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  acceptBookingTokens,
  refundAcceptedBookingTokens,
  refundReservedTokens,
  reserveTokens,
  settleAcceptedBookingTokens,
  settleReservedTokens,
  splitBookingTokens,
  tokenAmountUnitsFromPrice,
} from './tokenBookings.js';

test('booking prices convert to exact integer token units', () => {
  assert.equal(tokenAmountUnitsFromPrice(12.34), 1234);
  assert.equal(tokenAmountUnitsFromPrice(0.29), 29);
  assert.equal(tokenAmountUnitsFromPrice(0.57), 57);
  assert.throws(() => tokenAmountUnitsFromPrice(12.345), /at most two decimal places/);
});

test('booking split rounds the session-price deposit to the nearest hundredth token', () => {
  assert.deepEqual(splitBookingTokens(10000), {
    depositUnits: 2000,
    remainingUnits: 8000,
  });
  assert.deepEqual(splitBookingTokens(1234), {
    depositUnits: 247,
    remainingUnits: 987,
  });
  assert.throws(() => splitBookingTokens(4), /at least 0\.05 tokens/);
});

test('tutor acceptance charges the deposit and holds the remaining session price', () => {
  assert.deepEqual(
    acceptBookingTokens(
      { availableUnits: 15000, heldUnits: 50 },
      { availableUnits: 200, heldUnits: 10 },
      10000,
    ),
    {
      depositUnits: 2000,
      remainingUnits: 8000,
      student: { availableUnits: 5000, heldUnits: 8050 },
      tutor: { availableUnits: 200, heldUnits: 2010 },
    },
  );
  assert.throws(
    () => acceptBookingTokens(
      { availableUnits: 9999, heldUnits: 0 },
      { availableUnits: 0, heldUnits: 0 },
      10000,
    ),
    /not have enough available tokens/,
  );
});

test('cancellation refunds the deposit and releases the remaining held tokens', () => {
  assert.deepEqual(
    refundAcceptedBookingTokens(
      { availableUnits: 5000, heldUnits: 8000 },
      { availableUnits: 200, heldUnits: 2000 },
      10000,
      2000,
    ),
    {
      student: { availableUnits: 15000, heldUnits: 0 },
      tutor: { availableUnits: 200, heldUnits: 0 },
      remainingUnits: 8000,
    },
  );
  assert.throws(
    () => refundAcceptedBookingTokens(
      { availableUnits: 5000, heldUnits: 7999 },
      { availableUnits: 200, heldUnits: 2000 },
      10000,
      2000,
    ),
    /reserved token balance is inconsistent/,
  );
  assert.throws(
    () => refundAcceptedBookingTokens(
      { availableUnits: 5000, heldUnits: 8000 },
      { availableUnits: 200, heldUnits: 2000 },
      10000,
      1900,
    ),
    /deposit is inconsistent/,
  );
});

test('completion transfers the full price and releases both held portions', () => {
  assert.deepEqual(
    settleAcceptedBookingTokens(
      { availableUnits: 5000, heldUnits: 8000 },
      { availableUnits: 200, heldUnits: 2000 },
      10000,
      2000,
    ),
    {
      student: { availableUnits: 5000, heldUnits: 0 },
      tutor: { availableUnits: 10200, heldUnits: 0 },
      remainingUnits: 8000,
    },
  );
});

test('booking requests reserve available tokens and reject insufficient balance', () => {
  assert.deepEqual(reserveTokens({ availableUnits: 2500, heldUnits: 100 }, 1000), {
    availableUnits: 1500,
    heldUnits: 1100,
  });
  assert.throws(
    () => reserveTokens({ availableUnits: 999, heldUnits: 0 }, 1000),
    /not have enough available tokens/,
  );
});

test('rejection and cancellation refund a reservation exactly once by balance delta', () => {
  assert.deepEqual(refundReservedTokens({ availableUnits: 500, heldUnits: 1500 }, 1000), {
    availableUnits: 1500,
    heldUnits: 500,
  });
  assert.throws(
    () => refundReservedTokens({ availableUnits: 500, heldUnits: 0 }, 1000),
    /inconsistent/,
  );
});

test('session completion transfers held tokens to tutor balance', () => {
  assert.deepEqual(
    settleReservedTokens(
      { availableUnits: 500, heldUnits: 1500 },
      { availableUnits: 250, heldUnits: 20 },
      1000,
    ),
    {
      student: { availableUnits: 500, heldUnits: 500 },
      tutor: { availableUnits: 1250, heldUnits: 20 },
    },
  );
});

test('token lifecycle rejects invalid balances and unsafe integer overflow', () => {
  assert.throws(
    () => reserveTokens({ availableUnits: -1, heldUnits: 0 }, 100),
    /wallet balance is invalid/,
  );
  assert.throws(
    () => settleReservedTokens(
      { availableUnits: 0, heldUnits: 100 },
      { availableUnits: Number.MAX_SAFE_INTEGER, heldUnits: 0 },
      1,
    ),
    /exceeds the supported wallet balance/,
  );
});
