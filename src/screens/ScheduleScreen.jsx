import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Calendar from 'expo-calendar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ScreenContainer from '../components/ScreenContainer';
import { mockSchedules } from '../data/mockSchedules';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

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

function CalendarHeader({ view, setView, month, onMoveMonth }) {
  return (
    <>
      <View style={styles.monthRow}>
        <Pressable style={styles.iconButton} onPress={() => onMoveMonth(-1)} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
        <Pressable style={styles.iconButton} onPress={() => onMoveMonth(1)} accessibilityLabel="Next month">
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

function SessionCard({ session, onBookAgain, onPress, onCalendar, onCancel, onReschedule, onReminder }) {
  const roleStyle = getRoleStyle(session.role);
  return (
    <Pressable onPress={onPress} style={[styles.sessionCard, session.status === 'completed' ? styles.completedCard : styles.upcomingCard]}>
      <View style={styles.sessionTopRow}>
        <Text style={styles.sessionDate}>{formatSessionDate(session.dateKey)} • {formatDuration(session)} session</Text>
        <View style={styles.statusBadge}>
          <Ionicons name={session.status === 'completed' ? 'checkmark-circle-outline' : 'time-outline'} size={12} color={colors.success} />
          <Text style={styles.statusBadgeText}>{session.status === 'completed' ? 'Released' : 'Upcoming'}</Text>
        </View>
      </View>
      <View style={styles.sessionTitleRow}>
        <View style={styles.tutorAvatar}>{session.image ? <Image source={{ uri: session.image }} style={styles.tutorImage} /> : <Text style={styles.tutorAvatarText}>{session.tutorName.charAt(0)}</Text>}</View>
        <View style={styles.sessionTitleCopy}>
          <Text style={styles.sessionSubject}>{session.subject}</Text>
          <View style={[styles.roleTag, { backgroundColor: roleStyle.backgroundColor }]}>
            <Text style={[styles.roleTagText, { color: roleStyle.color }]}>{session.role}</Text>
          </View>
          <Text style={styles.tutorName}>{session.tutorName}</Text>
        </View>
        {session.total ? <View style={styles.totalBox}><Text style={styles.totalAmount}>{session.total}</Text><Text style={styles.totalLabel}>Verified Receipt</Text></View> : null}
      </View>
      <Text style={styles.sessionTime}><Ionicons name="time-outline" size={14} color={colors.mutedText} /> {session.startTime} - {session.endTime}</Text>
      <View style={styles.sessionMeta}><Ionicons name="location-outline" size={15} color={colors.mutedText} /><Text style={styles.sessionMetaText}>{session.location}</Text></View>
      {session.status === 'upcoming' ? <View style={styles.paymentRow}><Ionicons name="shield-checkmark-outline" size={14} color={colors.success} /><Text style={styles.paymentText}>{session.paymentStatus}</Text></View> : null}
      {session.rating ? <View style={styles.ratingBox}><Text style={styles.ratingStars}>★★★★★</Text><Text style={styles.ratingText}>{session.rating}</Text></View> : null}
      <View style={styles.sessionActions}>
        <Pressable style={styles.secondaryAction} onPress={(event) => { event.stopPropagation(); onBookAgain(); }}><Ionicons name="refresh-outline" size={15} color={colors.primary} /><Text style={styles.secondaryActionText}>Book Again</Text></Pressable>
        <Pressable style={styles.secondaryAction} onPress={(event) => { event.stopPropagation(); onCalendar(); }}><Ionicons name="calendar-outline" size={15} color={colors.primary} /><Text style={styles.secondaryActionText}>Add to Calendar</Text></Pressable>
        {session.status === 'upcoming' ? (
          <>
            <Pressable style={styles.disabledAction} disabled><Ionicons name="map-outline" size={15} color={colors.mutedText} /><Text style={styles.disabledActionText}>View Map Route</Text></Pressable>
            <Pressable style={styles.secondaryAction} onPress={(event) => { event.stopPropagation(); onReschedule(); }}><Ionicons name="swap-horizontal-outline" size={15} color={colors.primary} /><Text style={styles.secondaryActionText}>Reschedule</Text></Pressable>
            <Pressable style={styles.cancelAction} onPress={(event) => { event.stopPropagation(); onCancel(); }}><Ionicons name="close-circle-outline" size={15} color={colors.error} /><Text style={styles.cancelActionText}>Cancel</Text></Pressable>
            <Pressable style={styles.reminderAction} onPress={(event) => { event.stopPropagation(); onReminder(); }}><Ionicons name={session.reminderEnabled ? 'notifications' : 'notifications-outline'} size={15} color={colors.success} /><Text style={styles.reminderActionText}>{session.reminderEnabled ? 'Reminder On' : 'Set Reminder'}</Text></Pressable>
            <Pressable style={styles.primaryAction} disabled><Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.white} /><Text style={styles.primaryActionText}>Message {session.tutorName.split(' ')[0]}</Text></Pressable>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function WeekAgenda({ sessions, onBookAgain, onSelect, onCalendar, onCancel, onReschedule, onReminder }) {
  const groupedSessions = sessions.reduce((groups, session) => {
    if (!groups[session.dateKey]) groups[session.dateKey] = [];
    groups[session.dateKey].push(session);
    return groups;
  }, {});

  return Object.entries(groupedSessions).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate)).map(([key, daySessions]) => (
    <View key={key}>
      <Text style={styles.dayGroupTitle}>{formatSessionDate(daySessions[0].dateKey)}</Text>
      {daySessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => onSelect(session)} onBookAgain={() => onBookAgain(session)} onCalendar={() => onCalendar(session)} onCancel={() => onCancel(session)} onReschedule={() => onReschedule(session)} onReminder={() => onReminder(session)} />)}
    </View>
  ));
}

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState(() => normalizeSessionStatuses(mockSchedules));
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

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (stored) setSessions(normalizeSessionStatuses(JSON.parse(stored)));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [hydrated, sessions]);

  const visibleSessions = sessions.filter((session) => filter === 'all' || session.status === filter);
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

  function moveMonth(amount) {
    setMonth((current) => {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + amount, 1);
      setSelectedDate(nextMonth);
      return nextMonth;
    });
  }

  function selectDate(date) {
    setSelectedDate(date);
    setMonth(date);
  }

  function changeFilter(nextFilter) {
    const matchingSessions = sessions
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

  function saveBooking() {
    if (!draftDate || !draftStartTime || !draftEndTime) {
      Alert.alert('Incomplete booking', 'Choose a date and time before saving.');
      return;
    }
    if (modalMode === 'reschedule') {
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
    Alert.alert('Cancel session?', `Cancel your session with ${session.tutorName}?`, [
      { text: 'Keep session', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: () => setSessions((current) => current.filter((item) => item.id !== session.id)) },
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
        body: `${session.subject} with ${session.tutorName} starts in one hour.`,
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
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Calendar permission needed', 'Allow calendar access to add this session.');
      return;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writableCalendar = calendars.find((calendar) => calendar.allowsModifications);
    if (!writableCalendar) {
      Alert.alert('No calendar available', 'Create a device calendar before exporting this session.');
      return;
    }
    await Calendar.createEventAsync(writableCalendar.id, {
      title: `${session.subject} with ${session.tutorName}`,
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
                    <View style={styles.detailHero}><View style={styles.tutorAvatar}><Text style={styles.tutorAvatarText}>{activeSession.tutorName.charAt(0)}</Text></View><View style={styles.modalTitleCopy}><Text style={styles.detailTutor}>{activeSession.tutorName}</Text><Text style={styles.detailRole}>{activeSession.role}</Text></View></View>
                    <View style={styles.detailRow}><Ionicons name="calendar-outline" size={17} color={colors.success} /><Text style={styles.detailText}>{formatSessionDate(activeSession.dateKey)}</Text></View>
                    <View style={styles.detailRow}><Ionicons name="time-outline" size={17} color={colors.success} /><Text style={styles.detailText}>{activeSession.startTime} - {activeSession.endTime} ({formatDuration(activeSession)})</Text></View>
                    <View style={styles.detailRow}><Ionicons name="location-outline" size={17} color={colors.success} /><Text style={styles.detailText}>{activeSession.location}</Text></View>
                    <View style={styles.detailNote}><Text style={styles.detailNoteLabel}>Session notes</Text><Text style={styles.detailText}>{activeSession.notes || 'No notes added yet.'}</Text></View>
                    <Pressable style={styles.primaryAction} onPress={() => openScheduleModal(activeSession, 'reschedule')}><Ionicons name="swap-horizontal-outline" size={16} color={colors.white} /><Text style={styles.primaryActionText}>Reschedule Session</Text></Pressable>
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
        <View style={styles.calendarCard}>
          <CalendarHeader view={view} setView={setView} month={month} onMoveMonth={moveMonth} />
          {view === 'month' ? <MonthGrid month={month} selectedDate={selectedDate} onSelectDate={selectDate} sessions={sessions} /> : <WeekStrip selectedDate={selectedDate} onSelectDate={selectDate} sessions={sessions} />}
          <Text style={styles.selectedDateText}>{formatShortDate(selectedDate)} • {view === 'agenda' ? 'Agenda' : `${view.charAt(0).toUpperCase()}${view.slice(1)} view`}</Text>
        </View>
        <FilterBar filter={filter} onChange={changeFilter} sessions={sessions} />
        {view === 'week' && displayedSessions.length ? <WeekAgenda sessions={displayedSessions} onSelect={(session) => openScheduleModal(session, 'details')} onBookAgain={(session) => openScheduleModal(session, 'booking')} onCalendar={addToCalendar} onCancel={cancelSession} onReschedule={(session) => openScheduleModal(session, 'reschedule')} onReminder={toggleReminder} /> : null}
        {view !== 'week' && upcomingSessions.length ? (
          <View>
            <View style={styles.sectionHeading}><Ionicons name="calendar-outline" size={20} color={colors.success} /><Text style={styles.sectionHeadingText}>Upcoming Agenda</Text><Text style={styles.sessionCount}>{upcomingSessions.length} Sessions</Text></View>
            {upcomingSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session, 'details')} onBookAgain={() => openScheduleModal(session, 'booking')} onCalendar={() => addToCalendar(session)} onCancel={() => cancelSession(session)} onReschedule={() => openScheduleModal(session, 'reschedule')} onReminder={() => toggleReminder(session)} />)}
          </View>
        ) : null}
        {view !== 'week' && completedSessions.length ? (
          <View>
            <Pressable style={styles.sectionHeading} onPress={() => setPastExpanded((current) => !current)}>
              <Ionicons name="archive-outline" size={20} color={colors.text} /><Text style={styles.sectionHeadingText}>Past Completed Sessions</Text><Text style={styles.sessionCount}>{completedSessions.length} total</Text><Ionicons name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
            </Pressable>
            {pastExpanded ? completedSessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openScheduleModal(session, 'details')} onBookAgain={() => openScheduleModal(session, 'booking')} onCalendar={() => addToCalendar(session)} onCancel={() => cancelSession(session)} onReschedule={() => openScheduleModal(session, 'reschedule')} onReminder={() => toggleReminder(session)} />) : null}
          </View>
        ) : null}
        {!displayedSessions.length ? <View style={styles.emptyState}><Ionicons name="calendar-clear-outline" size={30} color={colors.mutedText} /><Text style={styles.emptyTitle}>No sessions here</Text><Text style={styles.emptyText}>{view === 'agenda' ? 'Try another filter or choose a different calendar view.' : 'There are no sessions in this selected date range.'}</Text><Pressable style={styles.browseButton} onPress={() => navigation.navigate('Tutors')}><Ionicons name="people-outline" size={16} color={colors.white} /><Text style={styles.browseButtonText}>Browse Tutors</Text></Pressable></View> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, gap: spacing.md },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  pageTitle: { color: colors.heading, fontSize: 24, fontWeight: '800' },
  pageSubtitle: { color: colors.mutedText, fontSize: 12, marginTop: spacing.xs },
  todayButton: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  todayButtonText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  calendarCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  monthRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  iconButton: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.pill, height: 30, justifyContent: 'center', width: 30 },
  monthTitle: { color: colors.primary, flex: 1, fontSize: 18, fontWeight: '800' },
  viewToggle: { backgroundColor: colors.inputBackground, borderRadius: radius.pill, flexDirection: 'row', padding: 2 },
  viewOption: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  viewOptionActive: { backgroundColor: colors.white },
  viewOptionText: { color: colors.mutedText, fontSize: 10, fontWeight: '700' },
  viewOptionTextActive: { color: colors.primary },
  weekStrip: { backgroundColor: colors.inputBackground, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, padding: spacing.sm },
  dayCell: { alignItems: 'center', borderRadius: radius.sm, minWidth: 36, paddingVertical: spacing.sm },
  dayCellSelected: { backgroundColor: colors.primary },
  dayName: { color: colors.mutedText, fontSize: 10, fontWeight: '700' },
  dayNumber: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  dayTextSelected: { color: colors.white },
  dayDot: { backgroundColor: 'transparent', borderRadius: 3, height: 6, marginTop: 4, width: 6 },
  dayDotActive: { backgroundColor: colors.primary },
  dayDotSelected: { backgroundColor: colors.mint },
  selectedDateText: { color: colors.mutedText, fontSize: 11, marginTop: spacing.sm, textAlign: 'center' },
  filterBar: { flexDirection: 'row', gap: spacing.sm },
  filterPill: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.pill, flex: 1, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  filterPillSelected: { backgroundColor: colors.primary },
  filterText: { color: colors.mutedText, fontSize: 10, fontWeight: '700' },
  filterTextSelected: { color: colors.white },
  filterCount: { backgroundColor: colors.border, borderRadius: radius.pill, color: colors.mutedText, fontSize: 9, fontWeight: '800', marginLeft: 4, paddingHorizontal: 5, paddingVertical: 2 },
  filterCountSelected: { backgroundColor: colors.mint, color: colors.success },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  sectionHeadingText: { color: colors.heading, flex: 1, fontSize: 17, fontWeight: '800', marginLeft: spacing.sm },
  sessionCount: { backgroundColor: colors.mint, borderRadius: radius.pill, color: colors.success, fontSize: 10, fontWeight: '800', marginRight: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  dayGroupTitle: { color: colors.success, fontSize: 12, fontWeight: '800', marginTop: spacing.sm, paddingHorizontal: spacing.sm, textTransform: 'uppercase' },
  sessionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, marginTop: spacing.sm, padding: spacing.md },
  upcomingCard: { borderTopColor: colors.primary, borderTopWidth: 5 },
  completedCard: { borderTopColor: colors.border, borderTopWidth: 1 },
  sessionTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sessionDate: { color: colors.mutedText, flex: 1, fontSize: 11, fontWeight: '700' },
  statusBadge: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: radius.pill, flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusBadgeText: { color: colors.success, fontSize: 10, fontWeight: '800', marginLeft: 3 },
  sessionTitleRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  tutorAvatar: { alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 24, height: 48, justifyContent: 'center', marginRight: spacing.md, width: 48 },
  tutorImage: { borderRadius: 24, height: 48, width: 48 },
  tutorAvatarText: { color: colors.white, fontSize: 20, fontWeight: '800' },
  sessionTitleCopy: { flex: 1 },
  sessionSubject: { color: colors.heading, fontSize: 16, fontWeight: '800' },
  roleTag: { alignSelf: 'flex-start', borderRadius: radius.pill, marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  roleTagText: { fontSize: 10, fontWeight: '800' },
  tutorName: { color: colors.mutedText, fontSize: 13, marginTop: 3 },
  sessionTime: { color: colors.mutedText, fontSize: 11, marginTop: spacing.md },
  totalBox: { alignItems: 'flex-end', marginLeft: spacing.sm },
  totalAmount: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  totalLabel: { color: colors.mutedText, fontSize: 10, marginTop: 3, textAlign: 'right' },
  sessionMeta: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.md, padding: spacing.sm },
  sessionMetaText: { color: colors.text, flex: 1, fontSize: 11, marginLeft: spacing.xs },
  paymentRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm },
  paymentText: { color: colors.success, fontSize: 11, fontWeight: '700', marginLeft: spacing.xs },
  ratingBox: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.sm, padding: spacing.sm },
  ratingStars: { color: colors.warning, fontSize: 13, letterSpacing: 1 },
  ratingText: { color: colors.mutedText, flex: 1, fontSize: 11, marginLeft: spacing.sm },
  sessionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  primaryAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, flexDirection: 'row', justifyContent: 'center', padding: spacing.sm, width: '100%' },
  primaryActionText: { color: colors.white, fontSize: 11, fontWeight: '800', marginLeft: spacing.xs },
  secondaryAction: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.sm, flex: 1, flexDirection: 'row', justifyContent: 'center', padding: spacing.sm },
  secondaryActionText: { color: colors.primary, fontSize: 11, fontWeight: '800', marginLeft: spacing.xs },
  disabledAction: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.sm, flex: 1, flexDirection: 'row', justifyContent: 'center', opacity: 0.7, padding: spacing.sm },
  disabledActionText: { color: colors.mutedText, fontSize: 11, fontWeight: '700', marginLeft: spacing.xs },
  cancelAction: { alignItems: 'center', backgroundColor: colors.peach, borderRadius: radius.sm, flex: 1, flexDirection: 'row', justifyContent: 'center', padding: spacing.sm },
  cancelActionText: { color: colors.error, fontSize: 11, fontWeight: '800', marginLeft: spacing.xs },
  reminderAction: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: radius.sm, flex: 1, flexDirection: 'row', justifyContent: 'center', padding: spacing.sm },
  reminderActionText: { color: colors.success, fontSize: 11, fontWeight: '800', marginLeft: spacing.xs },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  monthDayLabel: { color: colors.mutedText, fontSize: 9, fontWeight: '800', paddingBottom: spacing.sm, textAlign: 'center', width: '14.2857%' },
  monthCell: { alignItems: 'center', borderRadius: radius.sm, height: 42, justifyContent: 'center', width: '14.2857%' },
  monthCellSelected: { backgroundColor: colors.primary },
  monthCellText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  monthCellMuted: { color: colors.placeholder },
  monthCellDot: { backgroundColor: 'transparent', borderRadius: 3, height: 5, marginTop: 3, width: 5 },
  modalBackdrop: { backgroundColor: 'rgba(17, 15, 43, 0.42)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '90%', padding: spacing.lg },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: spacing.lg },
  modalTitleCopy: { flex: 1 },
  modalTitle: { color: colors.heading, fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: colors.mutedText, fontSize: 12, marginTop: spacing.xs },
  detailHero: { alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.md, padding: spacing.md },
  detailTutor: { color: colors.heading, fontSize: 16, fontWeight: '800' },
  detailRole: { color: colors.mutedText, fontSize: 12, marginTop: 3 },
  detailRow: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md },
  detailText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.sm },
  detailNote: { backgroundColor: colors.inputBackground, borderRadius: radius.sm, marginBottom: spacing.md, padding: spacing.md },
  detailNoteLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '800', marginBottom: spacing.xs },
  formLabel: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: spacing.sm, marginTop: spacing.sm },
  modalOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modalOption: { backgroundColor: colors.inputBackground, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  modalOptionActive: { backgroundColor: colors.mint, borderColor: colors.secondary },
  modalOptionText: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  modalOptionTextActive: { color: colors.success },
  modalInput: { backgroundColor: colors.inputBackground, borderRadius: radius.sm, color: colors.text, minHeight: 70, padding: spacing.md },
  modalCancelButton: { alignItems: 'center', padding: spacing.md },
  modalCancelText: { color: colors.mutedText, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  emptyTitle: { color: colors.heading, fontSize: 17, fontWeight: '800', marginTop: spacing.sm },
  emptyText: { color: colors.mutedText, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
  browseButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  browseButtonText: { color: colors.white, fontSize: 12, fontWeight: '800', marginLeft: spacing.xs },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.mutedText, fontSize: 12, marginTop: spacing.sm },
});