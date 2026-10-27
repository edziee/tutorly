import assert from 'node:assert/strict';
import { test } from 'node:test';

import { runStreakReminderOperation } from './streakReminderErrors.js';

test('streak reminder errors identify the failed step and preserve the original error', async () => {
  const originalError = new Error("Cannot find native module 'ExpoNotificationScheduler'");

  await assert.rejects(
    runStreakReminderOperation('scheduling the daily reminder', async () => {
      throw originalError;
    }),
    (error) => {
      assert.match(error.message, /scheduling the daily reminder/);
      assert.match(error.message, /ExpoNotificationScheduler/);
      assert.equal(error.cause, originalError);
      return true;
    },
  );
});
