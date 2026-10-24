import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatTokenUnits,
  getTokenBalanceLabel,
  isValidTokenAmount,
  toTokenUnits,
} from './tokens.js';

test('token amounts use exact integer minor units', () => {
  assert.equal(toTokenUnits(1), 100);
  assert.equal(toTokenUnits(12.34), 1234);
  assert.equal(isValidTokenAmount(0.29), true);
  assert.equal(isValidTokenAmount(12.345), false);
  assert.throws(() => toTokenUnits(0), /greater than zero/);
  assert.throws(() => toTokenUnits(-1), /greater than zero/);
  assert.throws(() => toTokenUnits(1.001), /at most two decimal places/);
});

test('wallet amounts format without pretending invalid balances are zero', () => {
  assert.equal(formatTokenUnits(200), '2');
  assert.equal(formatTokenUnits(1234), '12.34');
  assert.equal(formatTokenUnits(-1), '—');
  assert.equal(getTokenBalanceLabel(1234, 500), '12.34 tokens available, 5 on hold');
  assert.equal(getTokenBalanceLabel(null, 500), 'Token balance unavailable');
});
