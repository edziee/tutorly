import { ROLES, isTutorRole } from '../constants/roles.js';

export const WORKSPACE_MODES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
};

export function isWorkspaceMode(value) {
  return Object.values(WORKSPACE_MODES).includes(value);
}

export function getInitialWorkspaceMode(role, savedMode) {
  if (role === ROLES.STUDENT) {
    return isWorkspaceMode(savedMode) ? savedMode : WORKSPACE_MODES.STUDENT;
  }
  return isTutorRole(role) ? WORKSPACE_MODES.TUTOR : null;
}

export function getActiveWorkspace(role, selectedMode) {
  if (role === ROLES.STUDENT) {
    return selectedMode === WORKSPACE_MODES.TUTOR
      ? WORKSPACE_MODES.TUTOR
      : WORKSPACE_MODES.STUDENT;
  }
  if (isTutorRole(role)) return WORKSPACE_MODES.TUTOR;
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  return null;
}

export function isStudentWorkspace(role, selectedMode) {
  return role === ROLES.STUDENT && selectedMode !== WORKSPACE_MODES.TUTOR;
}

export function withWorkspaceMode(state, mode) {
  return {
    ...state,
    workspaceMode: mode,
    studentProfileOnModeSwitch: mode === WORKSPACE_MODES.STUDENT,
    workspaceModeError: null,
  };
}

export function canUseTutorOperations(role, applicationStatus) {
  return (
    (role === ROLES.STUDENT || isTutorRole(role)) &&
    applicationStatus === 'approved'
  );
}

export function hasDirectTutorAccountStatus(role, tutorVerificationStatus) {
  return (
    role === ROLES.TUTOR &&
    ['pending', 'approved', 'rejected'].includes(tutorVerificationStatus)
  );
}
