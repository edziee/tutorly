import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionStopwatch } from '../../components/SessionStopwatch';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ErrorState from '../../components/ErrorState';
import ScreenContainer from '../../components/ScreenContainer';
import StudentAvatar from '../../components/StudentAvatar';
import {
  BOOKING_PAYMENT_STATUS,
  BOOKING_STATUS,
  TOKEN_BOOKING_STATUS,
} from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { ROUTES } from '../../constants/routes';
import {
  subscribeToTutorBookings,
  updateBookingStatus,
} from '../../services/bookingService';
import { getOrCreateConversation } from '../../services/chatService';
import {
  createDateNotificationTrigger,
  getLocalNotificationsModule,
} from '../../services/localNotifications';
import { colors } from '../../theme/colors';
import styles from '../../theme/scheduleScreenStyles';
import { getErrorMessage } from '../../utils/errors';
import { formatTokenUnits } from '../../utils/tokens';

const initialDate = new Date();
const legacySessionsStorageKey = 'tutorly.schedule.sessions.v3';
const reminderStorageKey = 'tutorly.schedule.reminders.v1';
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const filters = [
  { key: 'all', label: 'All Sessions' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past Completed' },
];

function getNotificationsModule() {
  if (Platform.OS === 'web') return null;
  const Notifications = getLocalNotificationsModule(Platform.OS);
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  return Notifications;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setDate(date.getDate() - date.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSessionDate(dateKeyValue) {
  return new Date(`${dateKeyValue}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(session) {
  return `${session.durationHours}h`;
}

function toScheduleBooking(booking) {
  const amount = Number(booking.totalAmount);
  const legacyPaymentStatus = {
    [BOOKING_PAYMENT_STATUS.AWAITING_TUTOR_ACCEPTANCE]: 'Awaiting tutor response',
    [BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT]: 'Tutor accepted · Payment due',
    [BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION]: 'Payment reported · Awaiting verification',
    [BOOKING_PAYMENT_STATUS.SETTLED]: 'Payment confirmed by tutor',
    [BOOKING_PAYMENT_STATUS.NOT_APPLICABLE]: 'No payment due',
  }[booking.paymentStatus] ?? 'Payment status unavailable';
  const tokenPaymentStatus = {
    [TOKEN_BOOKING_STATUS.PENDING]: 'Request pending · no tokens deducted',
    [TOKEN_BOOKING_STATUS.NOT_CHARGED]: 'No tokens charged',
    [TOKEN_BOOKING_STATUS.RESERVED]: 'Tokens held · paid on completion',
    [TOKEN_BOOKING_STATUS.SETTLED]: 'Tokens received',
    [TOKEN_BOOKING_STATUS.REFUNDED]: 'Tokens refunded',
  }[booking.tokenStatus];
  const hasTokenAmount = Number.isSafeInteger(booking.tokenAmountUnits);

  return {
    ...booking,
    id: booking.id,
    bookingId: booking.id,
    studentName: booking.studentName || 'Student',
    subject: booking.subject || 'Tutoring session',
    dateKey: booking.dateKey,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationHours: booking.durationHours,
    status: booking.status === BOOKING_STATUS.COMPLETED ? 'completed' : 'upcoming',
    approvalStatus: booking.status,
    location: booking.location || 'Location not specified',
    role: booking.tutorTier || 'Tutor',
    total: hasTokenAmount
      ? formatTokenUnits(booking.tokenAmountUnits)
      : Number.isFinite(amount) ? `₱${amount.toFixed(2)}` : '',
    totalLabel: hasTokenAmount ? 'Tokens' : 'Session fee',
    paymentStatus: tokenPaymentStatus ?? legacyPaymentStatus,
    paymentStatusCode: booking.paymentStatus,
    image: booking.tutorPhotoUrl || null,
    rating: booking.review || null,
  };
}
function parseTime(dateKeyValue, time) {
  const [clock, period] = time.split(' ');
  let [hours, minutes] = clock.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  const date = new Date(`${dateKeyValue}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getRoleStyle(role) {
  if (role === 'Faculty Tier') return { backgroundColor: colors.peach, color: '#87511C' };
  return { backgroundColor: colors.lavender, color: colors.primary };
}

function CalendarHeader({ view, setView, month, onMovePeriod }) {
  const periodLabel = view === 'month' ? 'month' : 'week';

  return (
    <>
      <View style={styles.monthRow}>
        <Pressable style={styles.iconButton} onPress={() => onMovePeriod(-1)} accessibilityLabel={`Previous ${periodLabel}`}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
        <Pressable style={styles.iconButton} onPress={() => onMovePeriod(1)} accessibilityLabel={`Next ${periodLabel}`}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.viewToggle}>
          {['Month', 'Week', 'Agenda'].map((item) => (
            <Pressable key={item} onPress={() => setView(item.toLowerCase())} style={[styles.viewOption, view === item.toLowerCase() && styles.viewOptionActive]}>
              <Text style={[styles.viewOptionText, view === item.toLowerCase() && styles.viewOptionTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

function WeekStrip({ selectedDate, onSelectDate, sessions }) {
  const week = useMemo(() => {
    const first = startOfWeek(selectedDate);
    return weekDays.map((day, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  return (
    <View style={styles.weekStrip}>
      {week.map((date) => {
        const key = dateKey(date);
        const selected = key === dateKey(selectedDate);
        const hasSession = sessions.some((session) => session.dateKey === key);
        return (
          <Pressable key={key} onPress={() => onSelectDate(date)} style={[styles.dayCell, selected && styles.dayCellSelected]}>
            <Text style={[styles.dayName, selected && styles.dayTextSelected]}>{weekDays[date.getDay()].charAt(0) + weekDays[date.getDay()].slice(1).toLowerCase()}</Text>
            <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>{date.getDate()}</Text>
            <View style={[styles.dayDot, hasSession && styles.dayDotActive, selected && styles.dayDotSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function MonthGrid({ month, selectedDate, onSelectDate, sessions }) {
  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  return (
    <View style={styles.monthGrid}>
      {weekDays.map((day) => <Text key={day} style={styles.monthDayLabel}>{day.charAt(0) + day.slice(1).toLowerCase()}</Text>)}
      {cells.map((date) => {
        const key = dateKey(date);
        const selected = key === dateKey(selectedDate);
        const inMonth = date.getMonth() === month.getMonth();
        const hasSession = sessions.some((session) => session.dateKey === key);
        return (
          <Pressable key={key} onPress={() => onSelectDate(date)} style={[styles.monthCell, selected && styles.monthCellSelected]}>
            <Text style={[styles.monthCellText, !inMonth && styles.monthCellMuted, selected && styles.dayTextSelected]}>{date.getDate()}</Text>
            <View style={[styles.monthCellDot, hasSession && styles.dayDotActive, selected && styles.dayDotSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function FilterBar({ filter, onChange, sessions }) {
  return (
    <View style={styles.filterBar}>
      {filters.map((item) => {
        const selected = filter === item.key;
        const count = item.key === 'all' ? sessions.length : sessions.filter((session) => session.status === item.key).length;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.filterPill, selected && styles.filterPillSelected]}>
            <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
            <Text style={[styles.filterCount, selected && styles.filterCountSelected]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getCancellationNotice(session) {
  if (session.tokenStatus === TOKEN_BOOKING_STATUS.PENDING) {
    return 'This request has not been accepted, so no tokens have been deducted. Cancelling ends the request without changing either wallet.';
  }
  if (
    session.tokenStatus === TOKEN_BOOKING_STATUS.RESERVED &&
    Number.isSafeInteger(session.tokenAmountUnits) &&
    Number.isSafeInteger(session.tokenDepositUnits) &&
    session.tokenDepositUnits <= session.tokenAmountUnits
  ) {
    const remainingUnits = session.tokenAmountUnits - session.tokenDepositUnits;
    return `The student’s ${formatTokenUnits(session.tokenAmountUnits)} tokens will be returned to their available balance. This includes the ${formatTokenUnits(session.tokenDepositUnits)}-token deposit held for you, and releases the remaining ${formatTokenUnits(remainingUnits)} held tokens. No tokens will be paid to you.`;
  }
  if (
    session.tokenStatus === TOKEN_BOOKING_STATUS.RESERVED &&
    Number.isSafeInteger(session.tokenAmountUnits) &&
    !Number.isSafeInteger(session.tokenDepositUnits)
  ) {
    return `The student’s ${formatTokenUnits(session.tokenAmountUnits)} reserved tokens will be returned to their available balance. No tokens will be paid to you.`;
  }
  if (!session.tokenStatus) {
    return 'This is an older booking from the retired manual-payment flow. Cancelling does not issue a token refund. If payment was reported or confirmed, cancellation is blocked until you and the student resolve the payment.';
  }
  return 'Cancelling this session will apply the token outcome shown in its current booking status.';
}

function cancellationIsBlocked(session) {
  return Boolean(session && !session.tokenStatus && [
    BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION,
    BOOKING_PAYMENT_STATUS.SETTLED,
  ].includes(session.paymentStatusCode));
}

function SessionCard({ session, onPress, onCancel, onReminder, onMessage }) {
  return (
    <Pressable onPress={onPress} style={[styles.sessionCard, session.status === 'completed' ? styles.completedCard : styles.upcomingCard]}>
      <View style={styles.sessionTopRow}>
        <Text style={styles.sessionDate}>{formatSessionDate(session.dateKey)} • {formatDuration(session)} session</Text>
        <View style={styles.statusBadge}>
          <Ionicons name={session.status === 'completed' ? 'checkmark-circle-outline' : 'time-outline'} size={12} color={colors.success} />
          <Text style={styles.statusBadgeText}>
            {session.status === 'completed'
              ? 'Completed'
              : session.approvalStatus === BOOKING_STATUS.REQUESTED
                ? 'Requested'
                : 'Upcoming'}
          </Text>
        </View>
      </View>
      <View style={styles.sessionTitleRow}>
        <View style={styles.tutorAvatar}>
          <StudentAvatar imageUri={session.image} name={session.studentName} size={48} />
        </View>
        <View style={styles.sessionTitleCopy}>
          <Text style={styles.sessionSubject}>{session.subject}</Text>
          <Text style={styles.tutorName}>{session.studentName}</Text>
        </View>
        {session.total ? <View style={styles.totalBox}><Text style={styles.totalAmount}>{session.total}</Text><Text style={styles.totalLabel}>{session.totalLabel}</Text></View> : null}
      </View>
      <Text style={styles.sessionTime}><Ionicons name="time-outline" size={14} color={colors.mutedText} /> {session.startTime} - {session.endTime}</Text>
      <View style={styles.sessionMeta}><Ionicons name="location-outline" size={15} color={colors.mutedText} /><Text style={styles.sessionMetaText}>{session.location}</Text></View>
      {session.status === 'upcoming' ? <View style={styles.paymentRow}><Ionicons name="shield-checkmark-outline" size={14} color={colors.success} /><Text style={styles.paymentText}>{session.paymentStatus}</Text></View> : null}
      {session.rating ? <View style={styles.ratingBox}><Text style={styles.ratingStars}>★★★★★</Text><Text style={styles.ratingText}>{session.rating}</Text></View> : null}
      <View style={styles.sessionActions}>
        {session.status === 'upcoming' ? (
          <>
            <Pressable style={styles.cancelAction} onPress={(event) => { event.stopPropagation(); onCancel(); }}><Ionicons name="close-circle-outline" size={15} color={colors.error} /><Text style={styles.cancelActionText}>Cancel</Text></Pressable>
            <Pressable style={styles.reminderAction} onPress={(event) => { event.stopPropagation(); onReminder(); }}><Ionicons name={session.reminderEnabled ? 'notifications' : 'notifications-outline'} size={15} color={colors.success} /><Text style={styles.reminderActionText}>{session.reminderEnabled ? 'Reminder On' : 'Set Reminder'}</Text></Pressable>
            <Pressable
              accessibilityLabel={`Message ${session.studentName}`}
              accessibilityRole="button"
              style={styles.primaryAction}
              onPress={(event) => {
                event.stopPropagation();
                onMessage();
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.white} />
              <Text style={styles.primaryActionText}>Message {session.studentName.split(' ')[0]}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function WeekAgenda({ sessions, onSelect, onCancel, onReminder, onMessage }) {
  const groupedSessions = sessions.reduce((groups, session) => {
    if (!groups[session.dateKey]) groups[session.dateKey] = [];
    groups[session.dateKey].push(session);
    return groups;
  }, {});

  return Object.entries(groupedSessions).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate)).map(([key, daySessions]) => (
    <View key={key}>
      <Text style={styles.dayGroupTitle}>{formatSessionDate(daySessions[0].dateKey)}</Text>
      {daySessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => onSelect(session)} onCancel={() => onCancel(session)} onReminder={() => onReminder(session)} onMessage={() => onMessage(session)} />)}
    </View>
  ));
}

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const bookingResults = useSubscription(
    (onData, onError) => (
      user?.uid ? subscribeToTutorBookings(user.uid, onData, onError) : undefined
    ),
    [user?.uid],
  );
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(initialDate);
  const [view, setView] = useState('agenda');
  const [filter, setFilter] = useState('all');
  const [pastExpanded, setPastExpanded] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [cancelSessionDraft, setCancelSessionDraft] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [reminderIds, setReminderIds] = useState({});
  const [remindersLoaded, setRemindersLoaded] = useState(false);
  const remoteSessions = (bookingResults.data ?? [])
    .filter((booking) => [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.UPCOMING,
      BOOKING_STATUS.COMPLETED,
    ].includes(booking.status))
    .map((booking) => ({
      ...toScheduleBooking(booking),
      reminderId: reminderIds[booking.id] || null,
      reminderEnabled: Boolean(reminderIds[booking.id]),
      remindersLoaded,
    }));
  const allSessions = remoteSessions;
  const currentActiveSession = modalMode === 'details' && activeSession
    ? allSessions.find((session) => session.id === activeSession.id) ?? activeSession
    : activeSession;
  useEffect(() => {
    let active = true;
    const loadReminders = async () => {
      let nextReminderIds = {};
      try {
        const storedReminders = await AsyncStorage.getItem(reminderStorageKey);
        if (storedReminders) {
          const parsed = JSON.parse(storedReminders);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Saved schedule reminders have an invalid format.');
          }
          nextReminderIds = Object.fromEntries(
            Object.entries(parsed).filter(([, id]) => typeof id === 'string'),
          );
        }

        const legacySessions = await AsyncStorage.getItem(legacySessionsStorageKey);
        if (legacySessions) {
          const parsed = JSON.parse(legacySessions);
          if (!Array.isArray(parsed)) {
            throw new Error('Saved schedule sessions have an invalid format.');
          }
          const staleReminderIds = [];
          parsed.forEach((session) => {
            if (session.bookingId && typeof session.reminderId === 'string') {
              nextReminderIds[session.bookingId] = session.reminderId;
            } else if (typeof session.reminderId === 'string') {
              staleReminderIds.push(session.reminderId);
            }
          });
          const Notifications = staleReminderIds.length ? getNotificationsModule() : null;
          if (Notifications) {
            await Promise.all(
              staleReminderIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
            );
          }
          await AsyncStorage.setItem(reminderStorageKey, JSON.stringify(nextReminderIds));
          await AsyncStorage.removeItem(legacySessionsStorageKey);
        }
      } catch (error) {
        console.warn('Could not migrate schedule reminders:', error);
      } finally {
        if (active) {
          setReminderIds(nextReminderIds);
          setRemindersLoaded(true);
        }
      }
    };
    loadReminders();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!remindersLoaded) return;
    AsyncStorage.setItem(reminderStorageKey, JSON.stringify(reminderIds)).catch((error) => {
      console.warn('Could not save schedule reminders:', error);
    });
  }, [bookingResults.data, reminderIds, remindersLoaded]);

  useEffect(() => {
    if (!remindersLoaded || !bookingResults.data) return undefined;
    const cancelledBookings = new Set(
      bookingResults.data
        .filter((booking) => [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED].includes(booking.status))
        .map((booking) => booking.id),
    );
    const staleReminders = Object.entries(reminderIds)
      .filter(([bookingId]) => cancelledBookings.has(bookingId));
    if (!staleReminders.length) return undefined;

    let active = true;
    const clearCancelledReminders = async () => {
      const removedIds = [];
      const failedReminders = [];
      let Notifications;
      try {
        Notifications = getNotificationsModule();
      } catch (error) {
        console.warn('Could not load notifications to clear cancelled session reminders:', error);
        Alert.alert(
          'Couldn’t remove session reminder',
          'The booking was cancelled, but its reminder could not be removed. Please check notification settings.',
        );
        return;
      }
      for (const [bookingId, reminderId] of staleReminders) {
        try {
          if (Notifications) await Notifications.cancelScheduledNotificationAsync(reminderId);
          removedIds.push(bookingId);
        } catch (error) {
          failedReminders.push(error);
          console.warn(`Could not cancel reminder for booking ${bookingId}:`, error);
        }
      }
      if (!active) return;
      if (removedIds.length) {
        setReminderIds((current) => {
          const next = { ...current };
          removedIds.forEach((bookingId) => delete next[bookingId]);
          return next;
        });
      }
      if (failedReminders.length) {
        Alert.alert(
          'Couldn’t remove session reminder',
          'The booking was cancelled, but one or more reminders could not be removed. Please check notification settings.',
        );
      }
    };
    clearCancelledReminders();
    return () => { active = false; };
  }, [bookingResults.data, reminderIds, remindersLoaded]);

  const visibleSessions = allSessions.filter((session) => filter === 'all' || session.status === filter);
  const selectedKey = dateKey(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const selectedDateSessions = visibleSessions.filter((session) => session.dateKey === selectedKey);
  const selectedWeekSessions = visibleSessions.filter((session) => {
    const sessionDate = new Date(`${session.dateKey}T00:00:00`);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });
  const displayedSessions = view === 'agenda'
    ? visibleSessions
    : view === 'week'
      ? selectedWeekSessions
      : selectedDateSessions;

  async function messageStudent(session) {
    try {
      const conversationId = await getOrCreateConversation(
        session.studentId,
        user.uid,
        { bookingId: session.bookingId },
      );
      navigation.navigate(ROUTES.CONVERSATION, { conversationId });
    } catch (error) {
      Alert.alert('Couldn’t open chat', getErrorMessage(error, 'Could not open this conversation.'));
    }
  }
  const upcomingSessions = displayedSessions.filter((session) => session.status === 'upcoming');
  const completedSessions = displayedSessions.filter((session) => session.status === 'completed');

  function moveCalendarPeriod(amount) {
    const nextDate = view === 'month'
      ? new Date(month.getFullYear(), month.getMonth() + amount, 1)
      : new Date(selectedDate);

    if (view !== 'month') nextDate.setDate(nextDate.getDate() + amount * 7);
    setSelectedDate(nextDate);
    setMonth(nextDate);
  }

  function selectDate(date) {
    setSelectedDate(date);
    setMonth(date);
  }

  function changeFilter(nextFilter) {
    const matchingSessions = allSessions
      .filter((session) => nextFilter === 'all' || session.status === nextFilter)
      .sort((first, second) => first.dateKey.localeCompare(second.dateKey));
    const targetSession = nextFilter === 'completed'
      ? matchingSessions[matchingSessions.length - 1]
      : matchingSessions[0];

    setFilter(nextFilter);
    if (targetSession) {
      selectDate(new Date(`${targetSession.dateKey}T00:00:00`));
    }
  }

  function openScheduleModal(session) {
    setActiveSession(session);
    setModalMode('details');
  }

  function cancelSession(session) {
    setCancelError('');
    setCancelSessionDraft(session);
  }

  async function confirmCancelSession() {
    if (!cancelSessionDraft?.bookingId || cancelSubmitting || cancellationIsBlocked(cancelSessionDraft)) return;
    setCancelSubmitting(true);
    setCancelError('');
    try {
      const result = await updateBookingStatus(cancelSessionDraft.bookingId, BOOKING_STATUS.CANCELLED);
      setCancelSessionDraft(null);
      if (result?.notificationError) {
        Alert.alert(
          'Session cancelled, but notification failed',
          getErrorMessage(result.notificationError, 'The other participant may not have received a cancellation notice.'),
        );
      }
    } catch (error) {
      setCancelError(getErrorMessage(error, 'Couldn’t cancel your session. Please try again.'));
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function toggleReminder(session) {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) {
        Alert.alert('Reminders unavailable', 'Session reminders are available in the Tutorly app on Android and iOS.');
        return;
      }
      if (session.reminderEnabled && session.reminderId) {
        await Notifications.cancelScheduledNotificationAsync(session.reminderId);
        setReminderIds((current) => {
          const next = { ...current };
          delete next[session.id];
          return next;
        });
        Alert.alert('Reminder turned off', 'You won’t get a reminder for this session.');
        return;
      }
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Allow notifications', 'Turn on notifications to get session reminders.');
        return;
      }
      const reminderDate = parseTime(session.dateKey, session.startTime);
      reminderDate.setHours(reminderDate.getHours() - 1);
      if (reminderDate <= new Date()) {
        Alert.alert('Reminder unavailable', 'This session starts in less than an hour.');
        return;
      }
      const reminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Tutorly session',
          body: `${session.subject} with ${session.studentName} starts in one hour.`,
          data: { sessionId: session.id },
        },
        trigger: createDateNotificationTrigger(
          reminderDate,
          Notifications.SchedulableTriggerInputTypes,
        ),
      });
      setReminderIds((current) => ({ ...current, [session.id]: reminderId }));
      Alert.alert('Reminder set', 'We’ll remind you one hour before this session.');
    } catch (error) {
      console.warn('Could not set or update the session reminder:', error);
      const errorMessage = getErrorMessage(error, 'Please try again.');
      const missingNativeModule = /cannot find native module/i.test(errorMessage);
      Alert.alert(
        missingNativeModule ? 'Reminders unavailable' : 'Couldn’t update reminder',
        missingNativeModule
          ? 'The installed app is missing a compatible native notifications module. Update Expo Go to the project’s SDK version, or rebuild the development app, then try again.'
          : (__DEV__ && error instanceof Error
            ? error.message
            : getErrorMessage(error, 'Could not set the reminder. Check notification permission in device settings and try again.')),
      );
    }
  }

  if (!user?.uid) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Sign in to see your schedule"
        message="Your booking requests and sessions will appear here."
      />
    );
  }

  if (bookingResults.status === 'loading') {
    return <LoadingState message="Loading your sessions..." />;
  }
  if (bookingResults.status === 'error') {
    return (
      <ErrorState
        title="Bookings aren’t available"
        message={getErrorMessage(bookingResults.error)}
        onRetry={bookingResults.retry}
      />
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>My Schedule</Text>
            <Modal visible={Boolean(currentActiveSession && modalMode)} transparent animationType="slide" onRequestClose={() => setModalMode(null)}>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleCopy}>
                      <Text style={styles.modalTitle}>Session Details</Text>
                      <Text style={styles.modalSubtitle}>{currentActiveSession?.subject}</Text>
                    </View>
                    <Pressable onPress={() => setModalMode(null)} hitSlop={10}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
                  </View>
                  {modalMode === 'details' && currentActiveSession ? <SessionStopwatch session={currentActiveSession} /> : null}
                  <Pressable style={styles.modalCancelButton} onPress={() => setModalMode(null)}><Text style={styles.modalCancelText}>Close</Text></Pressable>
                </View>
              </View>
            </Modal>
            <Modal
              visible={Boolean(cancelSessionDraft)}
              transparent
              animationType="slide"
              onRequestClose={() => {
                if (!cancelSubmitting) setCancelSessionDraft(null);
              }}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleCopy}>
                      <Text style={styles.modalTitle}>
                        {cancellationIsBlocked(cancelSessionDraft)
                          ? 'Payment needs to be resolved'
                          : 'Cancel this session?'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {cancelSessionDraft?.subject} · {cancelSessionDraft?.studentName}
                      </Text>
                    </View>
                    <Pressable
                      disabled={cancelSubmitting}
                      onPress={() => setCancelSessionDraft(null)}
                      hitSlop={10}
                    >
                      <Ionicons name="close" size={22} color={colors.text} />
                    </Pressable>
                  </View>
                  <View style={styles.detailNote}>
                    <Text style={styles.detailNoteLabel}>What happens to the tokens?</Text>
                    <Text style={styles.cancellationNoticeText}>
                      {getCancellationNotice(cancelSessionDraft || {})}
                    </Text>
                  </View>
                  {cancelError ? (
                    <Text accessibilityRole="alert" style={styles.ratingError}>
                      {cancelError}
                    </Text>
                  ) : null}
                  {cancellationIsBlocked(cancelSessionDraft) ? (
                    <Pressable
                      style={styles.modalCancelButton}
                      onPress={() => setCancelSessionDraft(null)}
                    >
                      <Text style={styles.modalCancelText}>Close</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        disabled={cancelSubmitting}
                        style={[styles.cancelAction, styles.cancelConfirmAction]}
                        onPress={confirmCancelSession}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                        <Text style={styles.cancelActionText}>
                          {cancelSubmitting ? 'Cancelling…' : 'Cancel session'}
                        </Text>
                      </Pressable>
                      <Pressable
                        disabled={cancelSubmitting}
                        style={styles.modalCancelButton}
                        onPress={() => setCancelSessionDraft(null)}
                      >
                        <Text style={styles.modalCancelText}>Keep session</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Modal>
            <Text style={styles.pageSubtitle}>Plan sessions and keep track of your tutoring history</Text>
          </View>
          <Pressable style={styles.todayButton} onPress={() => selectDate(new Date())}><Text style={styles.todayButtonText}>Today</Text></Pressable>
        </View>

        <View style={styles.calendarCard}>
          <CalendarHeader view={view} setView={setView} month={month} onMovePeriod={moveCalendarPeriod} />
          {view === 'month' ? <MonthGrid month={month} selectedDate={selectedDate} onSelectDate={selectDate} sessions={allSessions} /> : <WeekStrip selectedDate={selectedDate} onSelectDate={selectDate} sessions={allSessions} />}
          <Text style={styles.selectedDateText}>{formatShortDate(selectedDate)} • {view === 'agenda' ? 'Agenda' : `${view.charAt(0).toUpperCase()}${view.slice(1)} view`}</Text>
        </View>
        <FilterBar filter={filter} onChange={changeFilter} sessions={allSessions} />
        {view === 'week' && displayedSessions.length ? <WeekAgenda sessions={displayedSessions} onSelect={openScheduleModal} onCancel={cancelSession} onReminder={toggleReminder} onMessage={messageStudent} /> : null}
        {view !== 'week' && upcomingSessions.length ? (
          <View>
            <View style={styles.sectionHeading}><Ionicons name="calendar-outline" size={20} color={colors.success} /><Text style={styles.sectionHeadingText}>Upcoming Agenda</Text><Text style={styles.sessionCount}>{upcomingSessions.length} Sessions</Text></View>
            {upcomingSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session)} onCancel={() => cancelSession(session)} onReminder={() => toggleReminder(session)} onMessage={() => messageStudent(session)} />)}
          </View>
        ) : null}
        {view !== 'week' && completedSessions.length ? (
          <View>
            <Pressable style={styles.sectionHeading} onPress={() => setPastExpanded((current) => !current)}>
              <Ionicons name="archive-outline" size={20} color={colors.text} /><Text style={styles.sectionHeadingText}>Past Completed Sessions</Text><Text style={styles.sessionCount}>{completedSessions.length} total</Text><Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
            </Pressable>
            {pastExpanded ? completedSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session)} onCancel={() => cancelSession(session)} onReminder={() => toggleReminder(session)} />) : null}
          </View>
        ) : null}
        {!displayedSessions.length ? <View style={styles.emptyState}><Ionicons name="calendar-clear-outline" size={30} color={colors.mutedText} /><Text style={styles.emptyTitle}>No sessions here</Text><Text style={styles.emptyText}>{view === 'agenda' ? 'Try another filter or choose a different calendar view.' : 'There are no sessions in this selected date range.'}</Text></View> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
