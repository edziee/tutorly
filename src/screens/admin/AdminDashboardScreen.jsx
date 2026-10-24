// Admin home: counts and shortcuts to users, verifications and bookings.
// It is not designed in Figma yet, so this is a simple layout built from the
// shared components. Replace it when Member 3 has a design.
// Layout: Member 3.   Data: Member 4 (adminService, Week 2).
// Plan task: "Connect the admin dashboard to Firestore (users list, approve or
// reject tutor and professional verification, bookings overview)" (Member 4,
// Week 2).
//
// It reads three things, each from adminService:
//   getUsers()                          -> total users and the count per role
//   getBookingsOverview()               -> total bookings and how many are waiting
//   subscribeToPendingVerifications()   -> live count of tutors to review
// The screen does not call Firebase itself. If one of the three fails, the whole
// screen shows the error with a "Try again" button, because half a dashboard
// would show wrong numbers.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import AppButton from '../../components/AppButton';
import { BOOKING_STATUS } from '../../constants/statuses';
import { isTutorRole, ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useSubscription } from '../../hooks/useSubscription';
import {
  getBookingsOverview,
  getUsers,
  subscribeToPendingVerifications,
} from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getAuthErrorMessage, getErrorMessage } from '../../utils/errors';

const countByRole = (users, role) => users.filter((user) => user.role === role).length;
const countTutors = (users) => users.filter((user) => isTutorRole(user.role)).length;
const countByStatus = (bookings, status) =>
  bookings.filter((booking) => booking.status === status).length;

export default function AdminDashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const users = useAsync(() => getUsers(), []);
  const bookings = useAsync(() => getBookingsOverview(), []);
  const pending = useSubscription(
    (onData, onError) => subscribeToPendingVerifications(onData, onError),
    [],
  );

  const parts = [users, bookings, pending];
  const failed = parts.find((part) => part.status === 'error');

  if (failed) {
    return (
      <ErrorState
        title="Dashboard isn’t available"
        message={getErrorMessage(failed.error)}
        onRetry={() => parts.forEach((part) => part.status === 'error' && part.retry())}
      />
    );
  }
  if (parts.some((part) => part.status === 'loading')) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const userList = Array.isArray(users.data) ? users.data : [];
  const bookingList = Array.isArray(bookings.data) ? bookings.data : [];
  const pendingList = Array.isArray(pending.data) ? pending.data : [];

  const goTo = (route) => navigation.navigate(route);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error));
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Overview</Text>

        <View style={styles.row}>
          <StatCard icon="people-outline" label="Users" value={userList.length} />
          <StatCard
            icon="shield-checkmark-outline"
            label="To review"
            value={pendingList.length}
          />
        </View>
        <View style={styles.row}>
          <StatCard icon="calendar-outline" label="Bookings" value={bookingList.length} />
          <StatCard
            icon="time-outline"
            label="Requested"
            value={countByStatus(bookingList, BOOKING_STATUS.REQUESTED)}
          />
        </View>

        <Card style={styles.rolesCard}>
          <Text style={styles.cardTitle}>Users by role</Text>
          <RoleLine label="Students" count={countByRole(userList, ROLES.STUDENT)} />
          <RoleLine label="Tutors" count={countTutors(userList)} />
          <RoleLine label="Admins" count={countByRole(userList, ROLES.ADMIN)} />
        </Card>

        <Text style={styles.heading}>Quick links</Text>
        <Shortcut
          icon="shield-checkmark-outline"
          title="Review verifications"
          detail={
            pendingList.length === 0
              ? 'All caught up'
              : `${pendingList.length} applications to review`
          }
          onPress={() => goTo(ROUTES.ADMIN_VERIFICATIONS)}
        />
        <Shortcut
          icon="people-outline"
          title="Manage users"
          detail="Browse and filter accounts"
          onPress={() => goTo(ROUTES.ADMIN_USERS)}
        />
        <Shortcut
          icon="calendar-outline"
          title="View bookings"
          detail="See all bookings and their status"
          onPress={() => goTo(ROUTES.ADMIN_BOOKINGS)}
        />
        <Shortcut
          icon="wallet-outline"
          title="Manage token wallets"
          detail="Review balances and record verified top-ups, payouts, or adjustments"
          onPress={() => goTo(ROUTES.ADMIN_WALLETS)}
        />
        {signOutError ? (
          <Text accessibilityRole="alert" style={styles.signOutError}>
            {signOutError}
          </Text>
        ) : null}
        <AppButton
          title="Sign out"
          variant="danger"
          onPress={handleSignOut}
          loading={signingOut}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function RoleLine({ label, count }) {
  return (
    <View style={styles.roleLine}>
      <Text style={styles.roleLabel}>{label}</Text>
      <Text style={styles.roleCount}>{count}</Text>
    </View>
  );
}

function Shortcut({ icon, title, detail, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={styles.shortcut}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.shortcutText}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  heading: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.heading,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rolesCard: {
    marginTop: spacing.xs,
  },
  cardTitle: {
    marginBottom: spacing.sm,
    color: colors.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  roleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 1,
  },
  roleLabel: {
    color: colors.text,
    fontSize: 14,
  },
  roleCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutError: {
    marginBottom: spacing.sm,
    color: colors.errorText,
    fontSize: 13,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  shortcutText: {
    flex: 1,
  },
  shortcutTitle: {
    color: colors.heading,
    fontSize: 14,
    fontWeight: '600',
  },
  shortcutDetail: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: 12,
  },
});
