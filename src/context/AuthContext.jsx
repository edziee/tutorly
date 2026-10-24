// Who is logged in, what account role they have, and which student workspace is
// selected. The navigators read this to decide which screens to show.
// Owner: Member 1.
//
// How it works: AuthProvider listens to Firebase Auth (subscribeToAuthState).
// When someone is logged in it loads their users/{uid} document and exposes it
// as `user`, with its `role` field as `role`. `loading` stays true until the
// first answer, so a person who is already logged in does not see the login
// screen flash by.
//
// All authenticated state comes from Firebase Authentication and user profiles.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { signOut, subscribeToAuthState } from '../services/authService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { ROLES } from '../constants/roles';
import {
  getInitialWorkspaceMode,
  isWorkspaceMode,
  withWorkspaceMode,
  WORKSPACE_MODES,
} from '../utils/workspace';

const workspaceModeKey = (uid) => `tutorly.workspaceMode.${uid}`;

const signedOut = {
  user: null, // the user's profile document, or null when logged out
  role: null, // one of ROLES in src/constants/roles.js, or null when logged out
  loading: false, // true while the app is still finding out who is logged in
  workspaceMode: WORKSPACE_MODES.STUDENT,
  studentProfileOnModeSwitch: false,
  workspaceModeError: null,
};

const AuthContext = createContext({
  ...signedOut,
  signOut: async () => {},
  updateProfile: async () => {},
  setWorkspaceMode: async () => {},
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ...signedOut, loading: true });
  // Counts auth events, so a slow profile load from an old event cannot
  // overwrite the result of a newer one.
  const latestEvent = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      const eventId = ++latestEvent.current;
      const isCurrent = () => eventId === latestEvent.current;

      if (!firebaseUser) {
        setState(signedOut);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (!isCurrent()) return;

        if (!profile) {
          // Logged in with Firebase but no users/{uid} document, so there is no
          // role to route by. Log out instead of leaving the person stuck.
          setState(signedOut);
          signOut().catch(() => {});
          return;
        }
        let savedMode = null;
        let workspaceModeError = null;
        if (profile.role === ROLES.STUDENT) {
          try {
            savedMode = await AsyncStorage.getItem(workspaceModeKey(firebaseUser.uid));
          } catch (error) {
            workspaceModeError = error;
            console.warn('Could not restore the selected workspace:', error);
          }
        }
        if (!isCurrent()) return;
        setState({
          user: profile,
          role: profile.role ?? null,
          loading: false,
          workspaceMode: getInitialWorkspaceMode(profile.role, savedMode),
          studentProfileOnModeSwitch: false,
          workspaceModeError,
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.warn('Could not load the user profile:', error);
        setState(signedOut);
      }
    });

    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    const signOutEventId = ++latestEvent.current;
    await signOut();
    if (latestEvent.current === signOutEventId) setState(signedOut);
  }, []);

  const handleUpdateProfile = useCallback(async (changes) => {
    const uid = state.user?.uid;
    if (!uid) throw new Error('A signed-in Firebase account is required.');
    await updateUserProfile(uid, changes);
    const safeChanges = { ...changes };
    ['id', 'uid', 'role', 'email', 'createdAt', 'tutorType'].forEach((field) => delete safeChanges[field]);
    setState((current) => ({
      ...current,
      user: { ...current.user, ...safeChanges },
    }));
  }, [state.user?.uid]);

  const handleSetWorkspaceMode = useCallback(async (mode) => {
    const uid = state.user?.uid;
    if (!uid || state.role !== ROLES.STUDENT) {
      throw new Error('Only a signed-in student can switch workspaces.');
    }
    if (!isWorkspaceMode(mode)) {
      throw new Error('Choose a valid workspace.');
    }

    setState((current) => (
      current.user?.uid === uid
        ? withWorkspaceMode(current, mode)
        : current
    ));
    try {
      await AsyncStorage.setItem(workspaceModeKey(uid), mode);
    } catch (error) {
      setState((current) => (
        current.user?.uid === uid
          ? { ...current, workspaceModeError: error }
          : current
      ));
      throw error;
    }
  }, [state.role, state.user?.uid]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
        setWorkspaceMode: handleSetWorkspaceMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
