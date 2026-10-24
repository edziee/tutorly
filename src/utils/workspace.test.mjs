import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ROLES } from '../constants/roles.js';
import {
  canUseTutorOperations,
  getActiveWorkspace,
  getInitialWorkspaceMode,
  hasDirectTutorAccountStatus,
  isStudentWorkspace,
  withWorkspaceMode,
  WORKSPACE_MODES,
} from './workspace.js';

test('student switches workspaces without changing role or signed-in user', () => {
  const account = { uid: 'student-1', role: ROLES.STUDENT };
  const studentState = { user: account, role: account.role, loading: false };
  const tutorState = withWorkspaceMode(studentState, WORKSPACE_MODES.TUTOR);
  const studentDashboardState = withWorkspaceMode(tutorState, WORKSPACE_MODES.STUDENT);

  assert.equal(tutorState.workspaceMode, WORKSPACE_MODES.TUTOR);
  assert.equal(studentDashboardState.workspaceMode, WORKSPACE_MODES.STUDENT);
  assert.equal(tutorState.user, account);
  assert.equal(studentDashboardState.user, account);
  assert.equal(tutorState.role, ROLES.STUDENT);
  assert.equal(studentDashboardState.role, ROLES.STUDENT);
  assert.equal(studentDashboardState.studentProfileOnModeSwitch, true);
});

test('saved workspace mode restores only for student accounts', () => {
  assert.equal(
    getInitialWorkspaceMode(ROLES.STUDENT, WORKSPACE_MODES.TUTOR),
    WORKSPACE_MODES.TUTOR,
  );
  assert.equal(
    getInitialWorkspaceMode(ROLES.STUDENT, 'invalid'),
    WORKSPACE_MODES.STUDENT,
  );
  assert.equal(getInitialWorkspaceMode(ROLES.TUTOR, WORKSPACE_MODES.STUDENT), WORKSPACE_MODES.TUTOR);
  assert.equal(getInitialWorkspaceMode(ROLES.ADMIN, WORKSPACE_MODES.TUTOR), null);
});

test('only approved student applicants and tutor roles can perform tutor operations', () => {
  for (const role of [ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL]) {
    assert.equal(canUseTutorOperations(role, 'approved'), true);
    assert.equal(canUseTutorOperations(role, 'pending'), false);
    assert.equal(canUseTutorOperations(role, 'rejected'), false);
    assert.equal(canUseTutorOperations(role, 'not_submitted'), false);
  }
  assert.equal(canUseTutorOperations(ROLES.ADMIN, 'approved'), false);
});

test('existing professional and admin routing is unchanged', () => {
  assert.equal(getActiveWorkspace(ROLES.TUTOR, WORKSPACE_MODES.STUDENT), WORKSPACE_MODES.TUTOR);
  assert.equal(getActiveWorkspace(ROLES.PROFESSIONAL, WORKSPACE_MODES.STUDENT), WORKSPACE_MODES.TUTOR);
  assert.equal(getActiveWorkspace(ROLES.ADMIN, WORKSPACE_MODES.TUTOR), ROLES.ADMIN);
});

test('direct tutor signups are identifiable without treating student applicants as tutor accounts', () => {
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'pending'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'approved'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'rejected'), true);
  assert.equal(hasDirectTutorAccountStatus(ROLES.TUTOR, 'not_submitted'), false);
  assert.equal(hasDirectTutorAccountStatus(ROLES.STUDENT, 'pending'), false);
  assert.equal(hasDirectTutorAccountStatus(ROLES.PROFESSIONAL, 'pending'), false);
});

test('student-only tutor discovery follows the selected workspace, not the account role alone', () => {
  assert.equal(isStudentWorkspace(ROLES.STUDENT, WORKSPACE_MODES.STUDENT), true);
  assert.equal(isStudentWorkspace(ROLES.STUDENT, WORKSPACE_MODES.TUTOR), false);
  assert.equal(isStudentWorkspace(ROLES.TUTOR, WORKSPACE_MODES.STUDENT), false);
  assert.equal(isStudentWorkspace(ROLES.PROFESSIONAL, WORKSPACE_MODES.TUTOR), false);
});
