import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isTutorPresenceActive,
  TUTOR_PRESENCE_TIMEOUT_MS,
} from './tutorPresence.js';

test('tutor presence is active only while online and within the heartbeat timeout', () => {
  const now = 1_800_000_000_000;

  assert.equal(isTutorPresenceActive({
    online: true,
    lastSeenAt: new Date(now - 30_000),
  }, now), true);
  assert.equal(isTutorPresenceActive({
    online: true,
    lastSeenAt: new Date(now - TUTOR_PRESENCE_TIMEOUT_MS - 1),
  }, now), false);
  assert.equal(isTutorPresenceActive({
    online: false,
    lastSeenAt: new Date(now),
  }, now), false);
  assert.equal(isTutorPresenceActive({ online: true }, now), false);
});
