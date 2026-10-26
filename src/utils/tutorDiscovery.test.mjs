import assert from 'node:assert/strict';
import { test } from 'node:test';

import { excludeCurrentUserTutor } from './tutorDiscovery.js';

test('student discovery excludes only the signed-in users tutor profile', () => {
  const tutors = [
    { uid: 'student-peer-tutor', name: 'Current user' },
    { uid: 'peer-tutor-a', name: 'Peer tutor A' },
    { uid: 'peer-tutor-b', name: 'Peer tutor B' },
  ];

  assert.deepEqual(
    excludeCurrentUserTutor(tutors, 'student-peer-tutor'),
    tutors.slice(1),
  );
});

test('student discovery leaves tutor results unchanged without a signed-in user id', () => {
  const tutors = [{ uid: 'peer-tutor-a' }, { uid: 'peer-tutor-b' }];

  assert.equal(excludeCurrentUserTutor(tutors, null), tutors);
});
