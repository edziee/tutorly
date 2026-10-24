import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  refundReservedTokens,
  reserveTokens,
  settleReservedTokens,
  tokenAmountUnitsFromPrice,
} from './tokenBookings.js';

test('booking prices convert to exact integer token units', () => {
  assert.equal(tokenAmountUnitsFromPrice(12.34), 1234);
  assert.equal(tokenAmountUnitsFromPrice(0.29), 29);
  assert.equal(tokenAmountUnitsFromPrice(0.57), 57);
  assert.throws(() => tokenAmountUnitsFromPrice(12.345), /at most two decimal places/);
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
