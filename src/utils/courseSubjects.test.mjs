import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getAvailableSubjectFilters,
  getSubjectForCourse,
  OTHER_SUBJECT_LABEL,
  tutorMatchesSubject,
} from './courseSubjects.js';

test('course codes and titles map to broader subjects independent of case and spacing', () => {
  assert.equal(getSubjectForCourse('CS101: Programming'), 'Computer Science & IT');
  assert.equal(getSubjectForCourse(' math 003 : Number theory '), 'Mathematics & Statistics');
  assert.equal(getSubjectForCourse('PHYS 201: Mechanics'), 'Natural Sciences');
  assert.equal(getSubjectForCourse('ENGR 101: Introduction'), 'Engineering');
  assert.equal(getSubjectForCourse('ACCT 210: Financial accounting'), 'Business & Economics');
  assert.equal(getSubjectForCourse('ENGL 110: Composition'), 'Languages & Communication');
  assert.equal(getSubjectForCourse('PSY 101: Introduction'), 'Social Sciences & Humanities');
  assert.equal(getSubjectForCourse('SCI 201: Political Science'), 'Social Sciences & Humanities');
  assert.equal(getSubjectForCourse('Introduction to Physics'), 'Natural Sciences');
  assert.equal(getSubjectForCourse('MATH 003'), 'Mathematics & Statistics');
});

test('course codes disambiguate generic titles and English codes defer to the title', () => {
  assert.equal(getSubjectForCourse('PHYS 201: Mechanics'), 'Natural Sciences');
  assert.equal(getSubjectForCourse('ENG 101: Engineering Design'), 'Engineering');
  assert.equal(getSubjectForCourse('ENG 102: English Composition'), 'Languages & Communication');
});

test('unmapped courses remain filterable as Other', () => {
  assert.equal(getSubjectForCourse('XYZ 999: Specialized Study'), OTHER_SUBJECT_LABEL);
  assert.equal(getSubjectForCourse(''), OTHER_SUBJECT_LABEL);
});

test('a tutor matches a subject when any listed course belongs to that subject', () => {
  const courses = ['HIST 101: World History', 'MATH 003: Number theory'];

  assert.equal(tutorMatchesSubject(courses, ' mathematics & statistics '), true);
  assert.equal(tutorMatchesSubject(courses, 'Computer Science & IT'), false);
  assert.equal(tutorMatchesSubject(courses, ''), true);
});

test('available subject filters are unique, ordered, and include Other only when needed', () => {
  assert.deepEqual(
    getAvailableSubjectFilters([
      'MATH 003: Number theory',
      'CS101: Programming',
      'CS 202: Data structures',
      'XYZ 999: Specialized Study',
    ]),
    [
      { id: 'all-subjects', keyword: '', label: 'All Subjects' },
      { id: 'Computer Science & IT', keyword: 'Computer Science & IT', label: 'Computer Science & IT' },
      { id: 'Mathematics & Statistics', keyword: 'Mathematics & Statistics', label: 'Mathematics & Statistics' },
      { id: 'Other', keyword: 'Other', label: 'Other' },
    ],
  );
});
