// The root navigator. It reads who is logged in (AuthContext) and shows the
// screens for that person's role:
//   not logged in -> AuthNavigator
//   student       -> StudentNavigator (already built)
//   tutor          -> TutorNavigator (including legacy professional accounts)
//   admin         -> AdminNavigator
// Owner: Member 1 (role routing) with Member 3 (the navigators and screens).
//
// App.js still renders StudentNavigator directly, because login does not exist
// yet. Switch App.js to this navigator when Member 1's login works (see
// "Switching on login" in docs/ARCHITECTURE.md). Put it inside the
// NavigationContainer that App.js already has; do not add a second one here.
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { ROLES } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TutorNavigator from './TutorNavigator';

export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) return <AuthNavigator />;

  switch (role) {
    case ROLES.STUDENT:
      return <StudentNavigator />;
    case ROLES.TUTOR:
    case ROLES.PROFESSIONAL:
      return <TutorNavigator />;
    case ROLES.ADMIN:
      return <AdminNavigator />;
    default:
      // Logged in, but the account has no valid role. Do not guess one.
      return (
        <ErrorState
          title="Account not set up"
          message="This account has no role yet. Please log out and sign up again, or contact the team."
        />
      );
  }
}
