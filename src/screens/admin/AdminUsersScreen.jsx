// List of all users, filterable by role.
// Layout: Member 3.   Data: Member 4 (adminService.getUsers, Week 2).
//
// It calls adminService.getUsers({ role }) (no filter for "All") and expects
// each user to look like the `users` document in docs/FIRESTORE_SCHEMA.md, with
// the document id as `id` (or `uid`): { id, name, email, role, verificationStatus? }.
// The search box filters the loaded list on the phone by name or email, so it
// does not cost extra Firestore reads. Pull down to refresh.
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import AppInput from '../../components/AppInput';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FilterChips from '../../components/FilterChips';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatusBadge from '../../components/StatusBadge';
import { VERIFICATION_STATUS_BADGE } from '../../components/StatusBadge';
import { isTutorRole, ROLES, ROLE_LABELS } from '../../constants/roles';
import { useAsync } from '../../hooks/useAsync';
import { getUsers } from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';

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
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');

  const { status, data, error, refreshing, retry } = useAsync(
    () => getUsers(role === 'all' || role === ROLES.TUTOR ? {} : { role }),
    [role],
  );

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
        placeholder="Search by name or email"
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
        title="Could not load users"
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
            ? 'No user matches your search.'
            : 'There are no users with this role yet.'
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
          renderItem={({ item }) => <UserRow user={item} />}
        />
      )}
    </ScreenContainer>
  );
}

function UserRow({ user }) {
  const verification = VERIFICATION_STATUS_BADGE[user.verificationStatus];
  const isTutor = isTutorRole(user.role);
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
          {isTutor && verification ? (
            <StatusBadge label={verification.label} tone={verification.tone} />
          ) : null}
        </View>
      </View>
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
