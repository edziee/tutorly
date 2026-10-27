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
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { signOut, subscribeToAuthState } from '../services/authService';
import {
  getUserProfile,
  subscribeToUserProfile,
  updateUserProfile,
} from '../services/userService';
import { ROLES } from '../constants/roles';
import {
  getInitialWorkspaceMode,
  isWorkspaceMode,
  withWorkspaceMode,
  WORKSPACE_MODES,
} from '../utils/workspace';
import {
  notifyStudentStreakMilestone,
  recordStudentDailyLogin,
} from '../services/streakService';

const workspaceModeKey = (uid) => `tutorly.workspaceMode.${uid}`;

const signedOut = {
  user: null, // the user's profile document, or null when logged out
  role: null, // one of ROLES in src/constants/roles.js, or null when logged out
  loading: false, // true while the app is still finding out who is logged in
  workspaceMode: WORKSPACE_MODES.STUDENT,
  studentProfileOnModeSwitch: false,
  workspaceModeError: null,
  dailyLogin: null,
  streakDays: 0,
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
  const profileUnsubscribe = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      const eventId = ++latestEvent.current;
      const isCurrent = () => eventId === latestEvent.current;
      profileUnsubscribe.current?.();
      profileUnsubscribe.current = null;

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
          signOut().catch((error) => {
            console.warn('Could not sign out an account with no profile:', error);
          });
          return;
        }
        let dailyLogin = null;
        let streakDays = Number(profile.stats?.streakDays) || 0;
        if (profile.role === ROLES.STUDENT) {
          try {
            const streak = await recordStudentDailyLogin(firebaseUser.uid, profile);
            streakDays = streak.streakDays;
            if (streak.firstLoginToday) {
              dailyLogin = { streakDays: streak.streakDays, milestone: streak.milestone };
              if (streak.milestone) {
                notifyStudentStreakMilestone(firebaseUser.uid, streak.milestone).catch((error) => {
                  console.warn('Could not send the streak milestone notification:', error);
                });
              }
            }
          } catch (error) {
            console.warn('Could not update the student streak:', error);
          }
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
          dailyLogin,
          streakDays,
        });
        profileUnsubscribe.current = subscribeToUserProfile(
          firebaseUser.uid,
          (updatedProfile) => {
            if (!isCurrent()) return;
            if (!updatedProfile) {
              setState(signedOut);
              signOut().catch((error) => {
                console.warn('Could not sign out an account with no profile:', error);
              });
              return;
            }
            setState((current) => (
              current.user?.uid === firebaseUser.uid
                ? { ...current, user: updatedProfile, role: updatedProfile.role ?? null }
                : current
            ));
          },
          (error) => {
            if (!isCurrent()) return;
            console.warn('Could not listen for user profile changes:', error);
          },
        );
      } catch (error) {
        if (!isCurrent()) return;
        console.warn('Could not load the user profile:', error);
        setState(signedOut);
      }
    });

    return () => {
      latestEvent.current += 1;
      profileUnsubscribe.current?.();
      unsubscribe();
    };
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
    [
      'id',
      'uid',
      'role',
      'email',
      'createdAt',
      'tutorType',
      'accountStatus',
      'accountStatusUpdatedAt',
      'accountStatusUpdatedBy',
    ].forEach((field) => delete safeChanges[field]);
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
        dismissDailyLogin: () => setState((current) => ({ ...current, dailyLogin: null })),
      }}
    >
      {children}
      <Modal
        visible={Boolean(state.dailyLogin)}
        transparent
        animationType="fade"
        onRequestClose={() => setState((current) => ({ ...current, dailyLogin: null }))}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          padding: 28,
          backgroundColor: 'rgba(20, 27, 38, 0.58)',
        }}>
          <View style={{
            alignItems: 'center',
            borderRadius: 24,
            padding: 28,
            backgroundColor: '#FFFFFF',
          }}>
            <View style={{
              width: 76,
              height: 76,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 38,
              backgroundColor: '#FFF1DF',
              marginBottom: 18,
            }}>
              <Ionicons name="flame" size={40} color="#F28C28" />
            </View>
            <Text style={{ color: '#202938', fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
              Daily login
            </Text>
            <Text style={{ color: '#596273', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
              You’re on a {state.dailyLogin?.streakDays}-day study streak. Keep showing up every day!
            </Text>
            {state.dailyLogin?.milestone ? (
              <Text style={{ color: '#A65B00', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 12 }}>
                {state.dailyLogin.milestone}-day milestone unlocked!
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => setState((current) => ({ ...current, dailyLogin: null }))}
              style={{
                alignSelf: 'stretch',
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: '#006F69',
                paddingVertical: 14,
                marginTop: 24,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
