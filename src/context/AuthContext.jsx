// Who is logged in, and what role they have. The navigators read this to decide
// which screens to show (see src/navigation/AppNavigator.jsx).
// Owner: Member 1.
//
// How it works: AuthProvider listens to Firebase Auth (subscribeToAuthState).
// When someone is logged in it loads their users/{uid} document and exposes it
// as `user`, with its `role` field as `role`. `loading` stays true until the
// first answer, so a person who is already logged in does not see the login
// screen flash by.
//
// signInDemo / signOutDemo are kept for screens that are not wired yet (the
// hidden admin login until Week 2). signOutDemo now also logs a real user out,
// so the existing "Log Out" buttons work for everyone.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { signOut, subscribeToAuthState } from '../services/authService';
import { getUserProfile } from '../services/userService';

const signedOut = {
  user: null, // the user's profile document, or null when logged out
  role: null, // one of ROLES in src/constants/roles.js, or null when logged out
  loading: false, // true while the app is still finding out who is logged in
};

const AuthContext = createContext({
  ...signedOut,
  signOut: async () => {},
  signInDemo: () => {},
  signOutDemo: () => {},
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
        setState({ user: profile, role: profile.role ?? null, loading: false });
      } catch (error) {
        if (!isCurrent()) return;
        console.warn('Could not load the user profile:', error);
        setState(signedOut);
      }
    });

    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      // Firebase not configured, or already logged out (demo login). Either way
      // the app should end up on the login screen.
    }
    latestEvent.current += 1;
    setState(signedOut);
  }, []);

  const signInDemo = useCallback((role) => {
    latestEvent.current += 1;
    setState({
      user: {
        id: `demo-${role}`,
        uid: `demo-${role}`,
        name: role === 'admin' ? 'Demo Admin' : role === 'tutor' ? 'Demo Tutor' : 'John Doe',
        email: role === 'admin' ? 'admin@tutorly.edu' : 'john.doe@university.edu',
        role,
        stats: {},
      },
      role,
      loading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, signOut: handleSignOut, signInDemo, signOutDemo: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
