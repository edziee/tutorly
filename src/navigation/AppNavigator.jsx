// The root navigator. It reads the account role and selected student workspace:
//   not logged in -> AuthNavigator
//   student       -> StudentNavigator or TutorNavigator (same student account)
//   tutor          -> TutorNavigator (including legacy professional accounts)
//   admin         -> AdminNavigator
// Owner: Member 1 (role routing) with Member 3 (the navigators and screens).
//
// App.js renders this navigator inside the NavigationContainer. Authentication
// state changes replace the role navigator with AuthNavigator after logout.
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import AccountSuspendedScreen from '../screens/shared/AccountSuspendedScreen';
import { USER_ACCOUNT_STATUS } from '../constants/statuses';
import { getActiveWorkspace } from '../utils/workspace';
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TutorNavigator from './TutorNavigator';

export default function AppNavigator() {
  const { user, role, loading, workspaceMode } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) return <AuthNavigator />;
  if (user.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED) {
    return <AccountSuspendedScreen />;
  }

  switch (getActiveWorkspace(role, workspaceMode)) {
    case 'student':
      return <StudentNavigator />;
    case 'tutor':
      return <TutorNavigator />;
    case 'admin':
      return <AdminNavigator />;
    default:
      // Logged in, but the account has no valid role. Do not guess one.
      return (
        <ErrorState
          title="Account not set up"
          message="Your account is missing a role. Sign out and sign up again, or contact support."
        />
      );
  }
}
