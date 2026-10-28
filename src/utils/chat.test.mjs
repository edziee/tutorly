import assert from 'node:assert/strict';
import test from 'node:test';

import { getConversationCounterparty } from './chat.js';

const conversation = {
  studentId: 'student-uid',
  tutorId: 'tutor-uid',
  studentName: 'Telle Bon',
  tutorName: 'Tutor Example',
  tutorTier: 'Professor',
};

test('tutor inbox labels the other participant as a student despite saved tutor tier', () => {
  assert.deepEqual(
    getConversationCounterparty(conversation, 'tutor-uid'),
    { name: 'Telle Bon', role: 'Student', category: 'Students' },
  );
});

test('student inbox keeps the tutor tier and faculty category', () => {
  assert.deepEqual(
    getConversationCounterparty(conversation, 'student-uid'),
    { name: 'Tutor Example', role: 'Professor', category: 'Faculty / Profs' },
  );
});

test('legacy conversation without a tutor tier uses a neutral tutor label', () => {
  const { tutorTier, ...legacyConversation } = conversation;

  assert.deepEqual(
    getConversationCounterparty(legacyConversation, 'student-uid'),
    { name: 'Tutor Example', role: 'Tutor', category: 'Active Tutors' },
  );
});
