// List of all users, filterable by role.
// Layout: Member 3.   Data: Member 4 (adminService.getUsers, Week 2).
//
// It calls adminService.getUsers({ role }) (no filter for "All") and expects
// each user to look like the `users` document in docs/FIRESTORE_SCHEMA.md, with
// the document id as `id` (or `uid`): { id, name, email, role, verificationStatus? }.
// The search box filters the loaded list on the phone by name or email, so it
// does not cost extra Firestore reads. Pull down to refresh.
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FilterChips from '../../components/FilterChips';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatusBadge from '../../components/StatusBadge';
import { VERIFICATION_STATUS_BADGE } from '../../components/StatusBadge';
import { USER_ACCOUNT_STATUS } from '../../constants/statuses';
import { isTutorRole, ROLES, ROLE_LABELS } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { getUsers, setUserAccountStatus } from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { getUserId } from '../../utils/user';

const roleFilters = [
  { value: 'all', label: 'All' },
  { value: ROLES.STUDENT, label: 'Students' },
  { value: ROLES.TUTOR, label: 'Tutors' },
  { value: ROLES.ADMIN, label: 'Admins' },
];

const roleTone = {
  [ROLES.STUDENT]: 'info',
  [ROLES.TUTOR]: 'success',
  [ROLES.PROFESSIONAL]: 'success',
  [ROLES.ADMIN]: 'warning',
};

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuth();
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionError, setActionError] = useState('');
  const currentUserId = getUserId(currentUser);

  const { status, data, error, refreshing, retry } = useAsync(
    () => getUsers(role === 'all' || role === ROLES.TUTOR ? {} : { role }),
    [role],
  );

  const requestStatusChange = (user, accountStatus) => {
    setActionError('');
    setSelectedAction({ user, accountStatus });
  };

  const confirmStatusChange = async () => {
    if (!selectedAction || savingStatus) return;
    setSavingStatus(true);
    setActionError('');
    try {
      await setUserAccountStatus(
        getUserId(selectedAction.user),
        selectedAction.accountStatus,
      );
      setSelectedAction(null);
      retry();
    } catch (failure) {
      setActionError(
        getErrorMessage(failure, 'Could not update the account. Please try again.'),
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const users = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const query = search.trim().toLowerCase();
    const roleFiltered = role === ROLES.TUTOR
      ? list.filter((user) => isTutorRole(user.role))
      : list;
    if (!query) return roleFiltered;
    return roleFiltered.filter(
      (user) =>
        String(user.name ?? '').toLowerCase().includes(query) ||
        String(user.email ?? '').toLowerCase().includes(query),
    );
  }, [data, role, search]);

  const header = (
    <View style={styles.header}>
      <AppInput
        value={search}
        handleChangeText={setSearch}
        placeholder="Search names or emails"
        leftIcon="search-outline"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search users"
      />
      <FilterChips options={roleFilters} value={role} onChange={setRole} />
    </View>
  );

  let body;
  if (status === 'loading') {
    body = <LoadingState compact message="Loading users..." />;
  } else if (status === 'error') {
    body = (
      <ErrorState
        compact
        title="Users aren’t available"
        message={getErrorMessage(error)}
        onRetry={retry}
      />
    );
  } else if (users.length === 0) {
    body = (
      <EmptyState
        compact
        icon="people-outline"
        title="No users found"
        message={
          search.trim()
            ? 'Try another name or email.'
            : 'No users in this role yet.'
        }
      />
    );
  }

  return (
    <ScreenContainer>
      {header}
      {body ?? (
        <FlatList
          data={users}
          keyExtractor={(item, index) => String(item.id ?? item.uid ?? index)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={retry} />}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              canManage={item.role !== ROLES.ADMIN && getUserId(item) !== currentUserId}
              onStatusChange={requestStatusChange}
            />
          )}
        />
      )}
      <Modal
        visible={Boolean(selectedAction)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingStatus) setSelectedAction(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.confirmation}>
            <Text style={styles.confirmationTitle}>
              {selectedAction?.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED
                ? 'Suspend this account?'
                : 'Reactivate this account?'}
            </Text>
            <Text style={styles.confirmationMessage}>
              {selectedAction?.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED
                ? `Suspending ${selectedAction?.user.name || 'this user'} will block their access to Tutorly. Their bookings, chats, and account history will remain saved. An admin can reactivate the account later.`
                : `Reactivating ${selectedAction?.user.name || 'this user'} will restore their access to Tutorly. Their bookings, chats, and account history remain unchanged.`}
            </Text>
            {actionError ? (
              <Text accessibilityRole="alert" style={styles.actionError}>
                {actionError}
              </Text>
            ) : null}
            <AppButton
              title={
                selectedAction?.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED
                  ? 'Suspend account'
                  : 'Reactivate account'
              }
              variant={
                selectedAction?.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED
                  ? 'danger'
                  : 'primary'
              }
              onPress={confirmStatusChange}
              loading={savingStatus}
            />
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setSelectedAction(null)}
              disabled={savingStatus}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function UserRow({ user, canManage, onStatusChange }) {
  const verification = VERIFICATION_STATUS_BADGE[user.verificationStatus];
  const isTutor = isTutorRole(user.role);
  const isSuspended = user.accountStatus === USER_ACCOUNT_STATUS.SUSPENDED;
  const name = user.name || 'No name';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.email}>
          {user.email || 'No email'}
        </Text>
        <View style={styles.badges}>
          <StatusBadge label={ROLE_LABELS[user.role] ?? 'Unknown role'} tone={roleTone[user.role]} />
          <StatusBadge
            label={isSuspended ? 'Suspended' : 'Active'}
            tone={isSuspended ? 'error' : 'success'}
          />
          {isTutor && verification ? (
            <StatusBadge label={verification.label} tone={verification.tone} />
          ) : null}
        </View>
      </View>
      {canManage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isSuspended ? 'Reactivate' : 'Suspend'} ${name}`}
          onPress={() => onStatusChange(
            user,
            isSuspended ? USER_ACCOUNT_STATUS.ACTIVE : USER_ACCOUNT_STATUS.SUSPENDED,
          )}
          style={[styles.actionButton, isSuspended && styles.reactivateButton]}
        >
          <Text style={[styles.actionText, isSuspended && styles.reactivateText]}>
            {isSuspended ? 'Reactivate' : 'Suspend'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  row: {
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
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.errorBackground,
  },
  actionText: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '700',
  },
  reactivateButton: {
    backgroundColor: colors.mint,
  },
  reactivateText: {
    color: colors.successText,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  confirmation: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  confirmationTitle: {
    color: colors.heading,
    fontSize: 19,
    fontWeight: '700',
  },
  confirmationMessage: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  actionError: {
    color: colors.errorText,
    fontSize: 13,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavender,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.heading,
    fontSize: 14,
    fontWeight: '600',
  },
  email: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm - 2,
  },
});
