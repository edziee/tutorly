// Overview of every booking in the app.
// Layout: Member 3.   Data: Member 4 (adminService.getBookingsOverview, Week 2).
//
// It calls adminService.getBookingsOverview() and expects each booking to look
// like the `bookings` document in docs/FIRESTORE_SCHEMA.md, with the document id
// as `id`: { id, studentName, tutorName, subject, dateKey, startTime, endTime,
// status, totalAmount }. The status chips filter the loaded list on the phone.
// Pull down to refresh.
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FilterChips from '../../components/FilterChips';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StatusBadge, { BOOKING_STATUS_BADGE } from '../../components/StatusBadge';
import { BOOKING_STATUS } from '../../constants/statuses';
import { useAsync } from '../../hooks/useAsync';
import { getBookingsOverview } from '../../services/adminService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { formatDateKey } from '../../utils/format';
import { formatTokenUnits } from '../../utils/tokens';

const statusFilters = [
  { value: 'all', label: 'All' },
  ...Object.values(BOOKING_STATUS).map((value) => ({
    value,
    label: BOOKING_STATUS_BADGE[value].label,
  })),
];

export default function AdminBookingsScreen() {
  const [filter, setFilter] = useState('all');
  const { status, data, error, refreshing, retry } = useAsync(() => getBookingsOverview(), []);

  const bookings = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return filter === 'all' ? list : list.filter((booking) => booking.status === filter);
  }, [data, filter]);

  let body;
  if (status === 'loading') {
    body = <LoadingState compact message="Loading bookings..." />;
  } else if (status === 'error') {
    body = (
      <ErrorState
        compact
        title="Bookings aren’t available"
        message={getErrorMessage(error)}
        onRetry={retry}
      />
    );
  } else if (bookings.length === 0) {
    body = (
      <EmptyState
        compact
        icon="calendar-outline"
        title="No bookings yet"
        message={
          filter === 'all'
            ? 'Student bookings will appear here.'
            : 'No bookings match this status.'
        }
      />
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <FilterChips options={statusFilters} value={filter} onChange={setFilter} />
      </View>
      {body ?? (
        <FlatList
          data={bookings}
          keyExtractor={(item, index) => String(item.id ?? index)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={retry} />}
          renderItem={({ item }) => <BookingRow booking={item} />}
        />
      )}
    </ScreenContainer>
  );
}

function BookingRow({ booking }) {
  const badge = BOOKING_STATUS_BADGE[booking.status] ?? { label: 'Unknown', tone: 'neutral' };
  const when = [formatDateKey(booking.dateKey), booking.startTime && booking.endTime
    ? `${booking.startTime} – ${booking.endTime}`
    : booking.startTime]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text numberOfLines={1} style={styles.subject}>
          {booking.subject || 'No subject'}
        </Text>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>
      <Text numberOfLines={1} style={styles.people}>
        {booking.studentName || 'Student'} with {booking.tutorName || 'Tutor'}
      </Text>
      <View style={styles.rowBottom}>
        <Text numberOfLines={1} style={styles.when}>
          {when}
        </Text>
        <Text style={styles.amount}>
          {booking.tokenAmountUnits != null
            ? `${formatTokenUnits(booking.tokenAmountUnits)} tokens`
            : `₱${Number(booking.totalAmount || 0).toFixed(2)} (legacy)`}
        </Text>
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
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  subject: {
    flex: 1,
    color: colors.heading,
    fontSize: 14,
    fontWeight: '600',
  },
  people: {
    marginTop: 2,
    color: colors.text,
    fontSize: 13,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  when: {
    flex: 1,
    color: colors.mutedText,
    fontSize: 12,
  },
  amount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
