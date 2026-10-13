// Who is logged in, and what role they have. The navigators read this to decide
// which screens to show (see src/navigation/AppNavigator.jsx).
// Owner: Member 1.
//
// Demo login is enabled while the screens are being reviewed. To finish the
// real login flow (Week 1 to 2):
//   1. Keep the value in state: const [state, setState] = useState({ ...signedOut, loading: true });
//   2. In a useEffect, call subscribeToAuthState from src/services/authService.js
//      and return the function it gives you, so the listener stops on unmount.
//   3. When it gives a Firebase user, load users/{uid} with getUserProfile and
//      set `user` to that profile and `role` to its role field.
//   4. When it gives null, set user and role back to null.
//   5. Set `loading` to false after the first answer, so the app does not flash
//      the login screen at a person who is already logged in.
// Then wrap the app in <AuthProvider> and render <AppNavigator /> in App.js
// (see "Switching on login" in docs/ARCHITECTURE.md).
import { createContext, useContext, useState } from 'react';

const signedOut = {
  user: null, // the user's profile document, or null when logged out
  role: null, // one of ROLES in src/constants/roles.js, or null when logged out
  loading: false, // true while the app is still finding out who is logged in
};

const AuthContext = createContext({
  ...signedOut,
  signInDemo: () => {},
  signOutDemo: () => {},
});

export function AuthProvider({ children }) {
  const [state, setState] = useState(signedOut);

  const signInDemo = (role) => {
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
  };

  const signOutDemo = () => setState(signedOut);

  return (
    <AuthContext.Provider value={{ ...state, signInDemo, signOutDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
