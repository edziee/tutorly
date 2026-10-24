import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Calendar from 'expo-calendar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SessionStopwatch  } from '../../components/SessionStopwatch';
import ErrorState from '../../components/ErrorState';
import ScreenContainer from '../../components/ScreenContainer';
import { ROUTES } from '../../constants/routes';
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS } from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { mockTutorSessions } from '../../data/mockTutorWorkspace';
import { mockSchedules } from '../../data/mockSchedules';
import { useSubscription } from '../../hooks/useSubscription';
import {
  rescheduleBooking,
  subscribeToStudentBookings,
  updateBookingStatus,
} from '../../services/bookingService';
import { colors } from '../../theme/colors';
import styles from '../../theme/scheduleScreenStyles';
import { getErrorMessage } from '../../utils/errors';

const initialDate = new Date();
const storageKey = 'tutorly.schedule.sessions.v3';
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const filters = [
  { key: 'all', label: 'All Sessions' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past Completed' },
];

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

function getNotificationsModule() {
  if (isExpoGo() || Platform.OS === 'web') return null;
  const Notifications = require('expo-notifications');
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

function normalizeSessionStatuses(sessionList) {
  const todayKey = dateKey(new Date());
  console.log(sessionList);
  return sessionList.map((session) => ({
    ...session,
    status: session.dateKey < todayKey ? 'completed' : 'upcoming',
  }));
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
  const paymentStatus = {
    [BOOKING_PAYMENT_STATUS.AWAITING_TUTOR_ACCEPTANCE]: 'Awaiting tutor response',
    [BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT]: 'Tutor accepted · Payment due',
    [BOOKING_PAYMENT_STATUS.PENDING_VERIFICATION]: 'Payment reported · Awaiting verification',
    [BOOKING_PAYMENT_STATUS.SETTLED]: 'Payment confirmed by tutor',
    [BOOKING_PAYMENT_STATUS.NOT_APPLICABLE]: 'No payment due',
  }[booking.paymentStatus] ?? 'Payment status unavailable';

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
    total: Number.isFinite(amount) ? `₱${amount.toFixed(2)}` : '',
    paymentStatus,
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

function SessionCard({ session, onBookAgain, onPress, onCalendar, onCancel, onReschedule, onReminder, onPay }) {
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
        <View style={styles.tutorAvatar}>{session.image ? <Image source={{ uri: session.image }} style={styles.tutorImage} /> : <Text style={styles.tutorAvatarText}>{session.studentName.charAt(0)}</Text>}</View>
        <View style={styles.sessionTitleCopy}>
          <Text style={styles.sessionSubject}>{session.subject}</Text>
          <Text style={styles.tutorName}>{session.studentName}</Text>
        </View>
        {session.total ? <View style={styles.totalBox}><Text style={styles.totalAmount}>{session.total}</Text><Text style={styles.totalLabel}>Session fee</Text></View> : null}
      </View>
      <Text style={styles.sessionTime}><Ionicons name="time-outline" size={14} color={colors.mutedText} /> {session.startTime} - {session.endTime}</Text>
      <View style={styles.sessionMeta}><Ionicons name="location-outline" size={15} color={colors.mutedText} /><Text style={styles.sessionMetaText}>{session.location}</Text></View>
      {session.status === 'upcoming' ? <View style={styles.paymentRow}><Ionicons name="shield-checkmark-outline" size={14} color={colors.success} /><Text style={styles.paymentText}>{session.paymentStatus}</Text></View> : null}
      {session.rating ? <View style={styles.ratingBox}><Text style={styles.ratingStars}>★★★★★</Text><Text style={styles.ratingText}>{session.rating}</Text></View> : null}
      <View style={styles.sessionActions}>
        <Pressable style={styles.secondaryAction} onPress={(event) => { event.stopPropagation(); onCalendar(); }}><Ionicons name="calendar-outline" size={15} color={colors.primary} /><Text style={styles.secondaryActionText}>Add to Calendar</Text></Pressable>
        {session.status === 'upcoming' ? (
          <>
            {session.bookingId &&
              session.approvalStatus === BOOKING_STATUS.UPCOMING &&
              session.paymentStatusCode === BOOKING_PAYMENT_STATUS.AWAITING_PAYMENT ? (
              session.tutorQrUrl ? (
                <Pressable
                  style={styles.primaryAction}
                  onPress={(event) => { event.stopPropagation(); onPay(); }}
                >
                  <Ionicons name="qr-code-outline" size={15} color={colors.white} />
                  <Text style={styles.primaryActionText}>Pay by tutor QR</Text>
                </Pressable>
              ) : (
                <View style={styles.disabledAction}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.mutedText} />
                  <Text style={styles.disabledActionText}>Tutor QR not set</Text>
                </View>
              )
            ) : null}
            {(!session.bookingId || session.approvalStatus === BOOKING_STATUS.UPCOMING) ? (
              <Pressable style={styles.secondaryAction} onPress={(event) => { event.stopPropagation(); onReschedule(); }}><Ionicons name="swap-horizontal-outline" size={15} color={colors.primary} /><Text style={styles.secondaryActionText}>Reschedule</Text></Pressable>
            ) : null}
            <Pressable style={styles.cancelAction} onPress={(event) => { event.stopPropagation(); onCancel(); }}><Ionicons name="close-circle-outline" size={15} color={colors.error} /><Text style={styles.cancelActionText}>Cancel</Text></Pressable>
            <Pressable style={styles.reminderAction} onPress={(event) => { event.stopPropagation(); onReminder(); }}><Ionicons name={session.reminderEnabled ? 'notifications' : 'notifications-outline'} size={15} color={colors.success} /><Text style={styles.reminderActionText}>{session.reminderEnabled ? 'Reminder On' : 'Set Reminder'}</Text></Pressable>
            <Pressable style={styles.primaryAction} disabled><Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.white} /><Text style={styles.primaryActionText}>Message {session.studentName.split(' ')[0]}</Text></Pressable>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function WeekAgenda({ sessions, onBookAgain, onSelect, onCalendar, onCancel, onReschedule, onReminder, onPay }) {
  const groupedSessions = sessions.reduce((groups, session) => {
    if (!groups[session.dateKey]) groups[session.dateKey] = [];
    groups[session.dateKey].push(session);
    return groups;
  }, {});

  return Object.entries(groupedSessions).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate)).map(([key, daySessions]) => (
    <View key={key}>
      <Text style={styles.dayGroupTitle}>{formatSessionDate(daySessions[0].dateKey)}</Text>
      {daySessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => onSelect(session)} onBookAgain={() => onBookAgain(session)} onCalendar={() => onCalendar(session)} onCancel={() => onCancel(session)} onReschedule={() => onReschedule(session)} onReminder={() => onReminder(session)} onPay={() => onPay(session)} />)}
    </View>
  ));
}

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const bookingResults = useSubscription(
    (onData, onError) => (
      user?.uid ? subscribeToStudentBookings(user.uid, onData, onError) : undefined
    ),
    [user?.uid],
  );
  const [sessions, setSessions] = useState(() => normalizeSessionStatuses(mockTutorSessions));
  const [hydrated, setHydrated] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(initialDate);
  const [view, setView] = useState('agenda');
  const [filter, setFilter] = useState('all');
  const [pastExpanded, setPastExpanded] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [draftDate, setDraftDate] = useState(dateKey(initialDate));
  const [draftStartTime, setDraftStartTime] = useState('4:00 PM');
  const [draftEndTime, setDraftEndTime] = useState('7:00 PM');
  const [draftNotes, setDraftNotes] = useState('');
  const remoteSessions = (bookingResults.data ?? [])
    .filter((booking) => [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.UPCOMING,
      BOOKING_STATUS.COMPLETED,
    ].includes(booking.status))
    .map(toScheduleBooking);
  const allSessions = [
    ...sessions.filter((session) => !session.bookingId),
  ];
  const [bookingIdInSession, setBookingIdInSession] = useState("");
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    setSessions(normalizeSessionStatuses(mockTutorSessions));
    setHydrated(true);
  }, []);

  /*
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (stored) setSessions(normalizeSessionStatuses(JSON.parse(stored)));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [hydrated, sessions]);
  */

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

  function openScheduleModal(session, mode) {
    setActiveSession(session);
    setDraftDate(session.dateKey);
    setDraftStartTime(session.startTime);
    setDraftEndTime(session.endTime);
    setDraftNotes(session.notes || '');
    setModalMode(mode);
  }

  async function saveBooking() {
    if (!draftDate || !draftStartTime || !draftEndTime) {
      Alert.alert('Incomplete booking', 'Choose a date and time before saving.');
      return;
    }
    if (modalMode === 'reschedule') {
      if (activeSession.bookingId) {
        try {
          await rescheduleBooking(activeSession.bookingId, {
            dateKey: draftDate,
            startTime: draftStartTime,
            endTime: draftEndTime,
          });
          setModalMode(null);
        } catch (error) {
          Alert.alert('Unable to reschedule', error.message || 'Please try again.');
        }
        return;
      }
      setSessions((current) => current.map((session) => session.id === activeSession.id ? {
        ...session,
        dateKey: draftDate,
        startTime: draftStartTime,
        endTime: draftEndTime,
        notes: draftNotes,
      } : session));
      Alert.alert('Session rescheduled', 'The updated session is now on your schedule.');
    } else {
      setSessions((current) => [...current, {
        ...activeSession,
        id: `session-${Date.now()}`,
        dateKey: draftDate,
        startTime: draftStartTime,
        endTime: draftEndTime,
        durationHours: 3,
        status: 'upcoming',
        notes: draftNotes,
        reminderEnabled: false,
      }]);
      Alert.alert('Session booked', 'The new session has been added to your schedule.');
    }
    setModalMode(null);
  }

  function cancelSession(session) {
    const cancel = async () => {
      if (session.bookingId) {
        try {
          await updateBookingStatus(session.bookingId, BOOKING_STATUS.CANCELLED);
        } catch (error) {
          Alert.alert('Unable to cancel session', error.message || 'Please try again.');
        }
        return;
      }
      setSessions((current) => current.filter((item) => item.id !== session.id));
    };
    if (Platform.OS === 'web') {
      cancel();
      return;
    }
    Alert.alert('Cancel session?', `Cancel your session with ${session.studentName}?`, [
      { text: 'Keep session', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: cancel },
    ]);
  }

  async function toggleReminder(session) {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      setSessions((current) => current.map((item) => item.id === session.id ? { ...item, reminderEnabled: !item.reminderEnabled, reminderId: null } : item));
      Alert.alert('In-app reminder enabled', 'Expo Go cannot load native Android notification services. This reminder is saved locally; use a development build for a system notification.');
      return;
    }
    if (session.reminderEnabled && session.reminderId) {
      await Notifications.cancelScheduledNotificationAsync(session.reminderId);
      setSessions((current) => current.map((item) => item.id === session.id ? { ...item, reminderEnabled: false, reminderId: null } : item));
      Alert.alert('Reminder disabled', 'You will no longer receive a reminder for this session.');
      return;
    }
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Notifications permission needed', 'Allow notifications to receive session reminders.');
      return;
    }
    const reminderDate = parseTime(session.dateKey, session.startTime);
    reminderDate.setHours(reminderDate.getHours() - 1);
    if (reminderDate <= new Date()) {
      Alert.alert('Reminder unavailable', 'This session starts too soon for a one-hour reminder.');
      return;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('session-reminders', {
        name: 'Session reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const reminderId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Tutorly session',
        body: `${session.subject} with ${session.studentName} starts in one hour.`,
        data: { sessionId: session.id },
      },
      trigger: reminderDate,
    });
    setSessions((current) => current.map((item) => item.id === session.id ? { ...item, reminderEnabled: true, reminderId } : item));
    Alert.alert('Reminder enabled', 'You will be reminded one hour before this session.');
  }

  async function addToCalendar(session) {
    if (Platform.OS === 'web') {
      Alert.alert('Device calendar', 'Calendar export is available on Android and iOS.');
      return;
    }
    const permission = await Calendar.requestCalendarPermissions();
    if (permission.status !== 'granted') {
      Alert.alert('Calendar permission needed', 'Allow calendar access to add this session.');
      return;
    }
    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const writableCalendar = calendars.find((calendar) => calendar.allowsModifications);
    if (!writableCalendar) {
      Alert.alert('No calendar available', 'Create a device calendar before exporting this session.');
      return;
    }
    await Calendar.createEvent(writableCalendar.id, {
      title: `${session.subject} with ${session.studntName}`,
      startDate: parseTime(session.dateKey, session.startTime),
      endDate: parseTime(session.dateKey, session.endTime),
      location: session.location,
      notes: session.notes,
    });
    Alert.alert('Added to calendar', 'This session was added to your device calendar.');
  }

  if (!hydrated) {
    return (
      <ScreenContainer>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>My Schedule</Text>
            <Modal visible={Boolean(activeSession && modalMode)} transparent animationType="slide" onRequestClose={() => setModalMode(null)}>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleCopy}>
                      <Text style={styles.modalTitle}>{modalMode === 'details' ? 'Session Details' : modalMode === 'reschedule' ? 'Reschedule Session' : 'Book Again'}</Text>
                      <Text style={styles.modalSubtitle}>{activeSession?.subject}</Text>
                    </View>
                    <Pressable onPress={() => setModalMode(null)} hitSlop={10}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
                  </View>
                  {modalMode === 'details' && activeSession ? (
                    <>
                      <SessionStopwatch session={activeSession} bookingIdInSession={bookingIdInSession} setBookingIdInSession={setBookingIdInSession} sessionTime={sessionTime} setSessionTime={setSessionTime}/>
                    </>
                  ) : (
                    <>
                      <Text style={styles.formLabel}>Choose a date</Text>
                      <View style={styles.modalOptions}>
                        {[0, 1, 2, 3, 4].map((offset) => {
                          const optionDate = new Date();
                          optionDate.setDate(optionDate.getDate() + offset);
                          const optionKey = dateKey(optionDate);
                          return <Pressable key={optionKey} onPress={() => setDraftDate(optionKey)} style={[styles.modalOption, draftDate === optionKey && styles.modalOptionActive]}><Text style={[styles.modalOptionText, draftDate === optionKey && styles.modalOptionTextActive]}>{offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : formatShortDate(optionDate)}</Text></Pressable>;
                        })}
                      </View>
                      <Text style={styles.formLabel}>Choose a time window</Text>
                      <View style={styles.modalOptions}>
                        {['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 7:00 PM', '6:00 PM - 8:00 PM'].map((window) => {
                          const [start, end] = window.split(' - ');
                          const selected = draftStartTime === start && draftEndTime === end;
                          return <Pressable key={window} onPress={() => { setDraftStartTime(start); setDraftEndTime(end); }} style={[styles.modalOption, selected && styles.modalOptionActive]}><Text style={[styles.modalOptionText, selected && styles.modalOptionTextActive]}>{window}</Text></Pressable>;
                        })}
                      </View>
                      <Text style={styles.formLabel}>Notes for your tutor</Text>
                      <TextInput value={draftNotes} onChangeText={setDraftNotes} placeholder="Add a topic or preparation note" placeholderTextColor={colors.placeholder} multiline style={styles.modalInput} />
                      <Pressable style={styles.primaryAction} onPress={saveBooking}><Ionicons name="checkmark-circle-outline" size={16} color={colors.white} /><Text style={styles.primaryActionText}>{modalMode === 'reschedule' ? 'Save New Time' : 'Confirm Booking'}</Text></Pressable>
                    </>
                  )}
                  <Pressable style={styles.modalCancelButton} onPress={() => setModalMode(null)}><Text style={styles.modalCancelText}>Close</Text></Pressable>
                </View>
              </View>
            </Modal>
            <Text style={styles.pageSubtitle}>Plan sessions and keep track of your tutoring history</Text>
          </View>
          <Pressable style={styles.todayButton} onPress={() => selectDate(new Date())}><Text style={styles.todayButtonText}>Today</Text></Pressable>
        </View>
        {bookingResults.status === 'error' ? (
          <ErrorState
            compact
            title="Could not load live bookings"
            message={getErrorMessage(bookingResults.error)}
            onRetry={bookingResults.retry}
          />
        ) : null}
        <View style={styles.calendarCard}>
          <CalendarHeader view={view} setView={setView} month={month} onMovePeriod={moveCalendarPeriod} />
          {view === 'month' ? <MonthGrid month={month} selectedDate={selectedDate} onSelectDate={selectDate} sessions={allSessions} /> : <WeekStrip selectedDate={selectedDate} onSelectDate={selectDate} sessions={allSessions} />}
          <Text style={styles.selectedDateText}>{formatShortDate(selectedDate)} • {view === 'agenda' ? 'Agenda' : `${view.charAt(0).toUpperCase()}${view.slice(1)} view`}</Text>
        </View>
        <FilterBar filter={filter} onChange={changeFilter} sessions={allSessions} />
        {view === 'week' && displayedSessions.length ? <WeekAgenda sessions={displayedSessions} onSelect={(session) => openScheduleModal(session, 'details')} onBookAgain={(session) => openScheduleModal(session, 'booking')} onCalendar={addToCalendar} onCancel={cancelSession} onReschedule={(session) => openScheduleModal(session, 'reschedule')} onReminder={toggleReminder} onPay={(session) => navigation.navigate(ROUTES.PAYMENT, { bookingId: session.bookingId })} /> : null}
        {view !== 'week' && upcomingSessions.length ? (
          <View>
            <View style={styles.sectionHeading}><Ionicons name="calendar-outline" size={20} color={colors.success} /><Text style={styles.sectionHeadingText}>Upcoming Agenda</Text><Text style={styles.sessionCount}>{upcomingSessions.length} Sessions</Text></View>
            {upcomingSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session, 'details')} onBookAgain={() => openScheduleModal(session, 'booking')} onCalendar={() => addToCalendar(session)} onCancel={() => cancelSession(session)} onReschedule={() => openScheduleModal(session, 'reschedule')} onReminder={() => toggleReminder(session)} onPay={() => navigation.navigate(ROUTES.PAYMENT, { bookingId: session.bookingId })} />)}
          </View>
        ) : null}
        {view !== 'week' && completedSessions.length ? (
          <View>
            <Pressable style={styles.sectionHeading} onPress={() => setPastExpanded((current) => !current)}>
              <Ionicons name="archive-outline" size={20} color={colors.text} /><Text style={styles.sectionHeadingText}>Past Completed Sessions</Text><Text style={styles.sessionCount}>{completedSessions.length} total</Text><Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
            </Pressable>
            {pastExpanded ? completedSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session, 'details')} onBookAgain={() => openScheduleModal(session, 'booking')} onCalendar={() => addToCalendar(session)} onCancel={() => cancelSession(session)} onReschedule={() => openScheduleModal(session, 'reschedule')} onReminder={() => toggleReminder(session)} onPay={() => navigation.navigate(ROUTES.PAYMENT, { bookingId: session.bookingId })} />) : null}
          </View>
        ) : null}
        {!displayedSessions.length ? <View style={styles.emptyState}><Ionicons name="calendar-clear-outline" size={30} color={colors.mutedText} /><Text style={styles.emptyTitle}>No sessions here</Text><Text style={styles.emptyText}>{view === 'agenda' ? 'Try another filter or choose a different calendar view.' : 'There are no sessions in this selected date range.'}</Text><Pressable style={styles.browseButton} onPress={() => navigation.navigate('Tutors')}><Ionicons name="people-outline" size={16} color={colors.white} /><Text style={styles.browseButtonText}>Browse Tutors</Text></Pressable></View> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
