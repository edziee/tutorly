import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import ScreenContainer from '../../components/ScreenContainer';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getErrorMessage } from '../../utils/errors';
import { createBooking } from '../../services/bookingService';

const SESSION_HOURS = [1, 2, 3];

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTutorDays(tutor) {
  const configuredDays = tutor.preferredDays?.length
    ? tutor.preferredDays
    : (tutor.availability ?? [])
      .filter((slot) => typeof slot === 'string')
      .map((slot) => slot.split(',')[0].trim());
  return new Set(configuredDays.filter((day) => typeof day === 'string').map((day) => day.toLowerCase()));
}

function getAvailableDates(tutor) {
  const days = getTutorDays(tutor);
  const dates = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 21 && dates.length < 5; offset += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    if (days.has(candidate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())) {
      dates.push(candidate);
    }
  }
  return dates;
}

function toMinutes(time) {
  if (typeof time !== 'string') return null;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const rawHours = Number(match[1]);
  const minute = Number(match[2]);
  if (rawHours < 1 || rawHours > 12 || minute > 59) return null;
  let hours = rawHours % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + minute;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const clockHour = hours % 12 || 12;
  return `${clockHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function getTutorSlots(tutor, selectedDate) {
  const dayName = selectedDate?.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const preferred = (tutor.preferredTimeSlots ?? [])
    .filter((slot) => typeof slot === 'string');
  const configured = (tutor.availability ?? [])
    .filter((slot) => typeof slot === 'string' && slot.toLowerCase().startsWith(`${dayName},`))
    .map((slot) => slot.slice(slot.indexOf(',') + 1).trim());
  const source = preferred.length ? preferred : configured;

  const now = new Date();
  const isToday = selectedDate && getDateKey(selectedDate) === getDateKey(now);
  return source.map((slot) => {
    const [start, end] = slot.split(/\s+-\s+/);
    const startMinutes = toMinutes(start.trim());
    const endMinutes = end ? toMinutes(end.trim()) : null;
    return {
      label: start.trim(),
      startTime: start.trim(),
      maxHours: !end
        ? (startMinutes === null ? 0 : 3)
        : startMinutes === null || endMinutes === null
          ? 0
          : Math.max(0, Math.min(3, Math.floor((endMinutes - startMinutes) / 60))),
    };
  }).filter((slot) =>
    slot.maxHours > 0 &&
    toMinutes(slot.startTime) !== null &&
    (!isToday || toMinutes(slot.startTime) > now.getHours() * 60 + now.getMinutes()),
  );
}

function DateChip({ date, selected, onPress }) {
  const today = getDateKey(date) === getDateKey(new Date());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.dateChip, selected && styles.dateChipSelected]}
    >
      <Text style={[styles.dateWeekday, selected && styles.selectedText]}>
        {today ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
      </Text>
      <Text style={[styles.dateDay, selected && styles.selectedText]}>{date.getDate()}</Text>
      <Text style={[styles.dateMonth, selected && styles.selectedText]}>
        {date.toLocaleDateString('en-US', { month: 'short' })}
      </Text>
    </Pressable>
  );
}

function SectionHeading({ title, trailing }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
    </View>
  );
}

export default function BookingScreen({ navigation, route }) {
  const { user } = useAuth();
  const tutor = route.params?.tutor;
  const availableDates = useMemo(() => (tutor ? getAvailableDates(tutor) : []), [tutor]);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [durationHours, setDurationHours] = useState(3);
  const [sessionMode, setSessionMode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!tutor) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="calendar-outline"
          title="Choose a tutor first"
          message="Return to the tutor list and choose Book Session."
          actionLabel="Browse tutors"
          onAction={() => navigation.navigate(ROUTES.TUTORS)}
        />
      </ScreenContainer>
    );
  }

  const dates = availableDates;
  const activeDateKey = selectedDateKey || (dates[0] ? getDateKey(dates[0]) : '');
  const activeDate = dates.find((date) => getDateKey(date) === activeDateKey) ?? dates[0];
  const activeSlots = activeDate ? getTutorSlots(tutor, activeDate) : [];
  const activeSlot = activeSlots.find((slot) => slot.startTime === selectedSlot);
  const validDurations = activeSlot
    ? SESSION_HOURS.filter((hours) => hours <= activeSlot.maxHours)
    : [];
  const safeDuration = validDurations.includes(durationHours)
    ? durationHours
    : validDurations[validDurations.length - 1] ?? 0;
  const tutorFormats = tutor.formats ?? [];
  const price = Number(tutor.hourlyRate);
  const hasPrice = Number.isFinite(price) && price > 0;
  const endTime = activeSlot && safeDuration
    ? formatTime(toMinutes(activeSlot.startTime) + safeDuration * 60)
    : '';
  const selectedLocation = sessionMode.toLowerCase().includes('online')
    ? 'Online session'
    : sessionMode.toLowerCase().includes('off-campus')
      ? tutor.location || 'Off-campus location to be agreed with tutor'
      : tutor.location || 'On-campus study room';
  const courseList = tutor.courses ?? [];
  const reviews = Array.isArray(tutor.reviews) ? tutor.reviews : [];

  const selectDate = (date) => {
    setSelectedDateKey(getDateKey(date));
    setSelectedSlot(null);
    setDurationHours(3);
  };

  const handleBook = async () => {
    if (!user?.uid) {
      setSubmitError('Sign in again before requesting a session.');
      return;
    }
    if (!activeDate || !activeSlot || !safeDuration || !sessionMode) {
      setSubmitError('Choose an available date, time, session length, and format.');
      return;
    }
    if (!hasPrice) {
      setSubmitError('This tutor has not set a session price yet. Please choose another tutor.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const dateKey = getDateKey(activeDate);
      await createBooking({
        studentId: user.uid,
        studentName: user.name || user.email || 'Student',
        tutorId: tutor.uid || tutor.id,
        tutorName: tutor.name,
        tutorTier: tutor.tier || '',
        subject: tutor.subject,
        dateKey,
        startTime: activeSlot.startTime,
        endTime,
        durationHours: safeDuration,
        location: selectedLocation,
        sessionMode,
        notes: notes.trim(),
        totalAmount: price,
        tutorPhotoUrl: tutor.photoUrl || '',
      });
      navigation.navigate(ROUTES.SCHEDULE);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not request this session. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const tierLabel = tutor.tier || 'Tutor';
  const displayPrice = hasPrice ? `₱${price.toFixed(2)}` : 'Price not set';

  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to tutors"
            onPress={() => navigation.navigate(ROUTES.TUTORS)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Book Session</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>{tutor.subject}</Text>
          </View>
          <View style={styles.headerAvatar}>
            {tutor.photoUrl ? (
              <Image source={{ uri: tutor.photoUrl }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerInitial}>{(user?.name || 'S').charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.statusRow}>
            <View style={styles.availablePill}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>
                {availableDates.length ? 'Available to request' : 'Availability not set'}
              </Text>
            </View>
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              <Text style={styles.verifiedText}>{tierLabel}</Text>
            </View>
          </View>

          <View style={styles.tutorCard}>
            <View style={styles.tutorRow}>
              <View style={styles.tutorAvatar}>
                {tutor.photoUrl ? (
                  <Image source={{ uri: tutor.photoUrl }} style={styles.tutorImage} />
                ) : (
                  <Text style={styles.tutorInitial}>{(tutor.name || 'T').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>{tutor.name}</Text>
                <Text style={styles.tutorSubject}>{tutor.subject}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#E9A11B" />
                  <Text style={styles.ratingValue}>{tutor.rating ?? 'New'}</Text>
                  <Text style={styles.reviewCount}>({tutor.reviewCount ?? 0} reviews)</Text>
                </View>
              </View>
            </View>
            <View style={styles.ratePanel}>
              <View>
                <Text style={styles.rateHeading}>Campus Session Rate</Text>
                <Text style={styles.rateSubheading}>Up to 3 hours per session</Text>
              </View>
              <Text style={styles.rateAmount}>{displayPrice}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeading title="Coursework & Accreditations" trailing={String(courseList.length)} />
            {courseList.length ? courseList.map((course) => (
              <View key={course.id || `${course.code}-${course.title}`} style={styles.courseRow}>
                <View style={styles.courseIcon}><Ionicons name="school-outline" size={15} color={colors.primary} /></View>
                <View style={styles.courseCopy}>
                  <Text style={styles.courseName}>{course.code} {course.title}</Text>
                  {course.grade ? <Text style={styles.courseGrade}>Verified grade · {course.grade}</Text> : null}
                </View>
              </View>
            )) : (
              <Text style={styles.helperText}>No verified course details are available yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeading title="Session Modes" />
            {tutorFormats.length ? (
              <View style={styles.modeList}>
                {tutorFormats.map((format) => {
                  const selected = sessionMode === format;
                  return (
                    <Pressable
                      key={format}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSessionMode(format)}
                      style={[styles.modeOption, selected && styles.modeOptionSelected]}
                    >
                      <Ionicons
                        name={format.toLowerCase().includes('online') ? 'videocam-outline' : 'location-outline'}
                        size={17}
                        color={selected ? colors.primary : colors.mutedText}
                      />
                      <View style={styles.modeCopy}>
                        <Text style={styles.modeTitle}>{format}</Text>
                        <Text style={styles.modeDescription}>
                          {format.toLowerCase().includes('online')
                            ? 'Join your tutor online at the scheduled time.'
                            : 'Meet at the tutor’s listed campus location.'}
                        </Text>
                      </View>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selected ? colors.primary : colors.mutedText}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.helperText}>This tutor has not listed a session format yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeading title="Select Date & Time" trailing="Campus local time" />
            {dates.length ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                  {dates.map((date) => (
                    <DateChip
                      key={getDateKey(date)}
                      date={date}
                      selected={getDateKey(date) === activeDateKey}
                      onPress={() => selectDate(date)}
                    />
                  ))}
                </ScrollView>
                {activeSlots.length ? (
                  <View style={styles.slotList}>
                    {activeSlots.map((slot) => {
                      const selected = selectedSlot === slot.startTime;
                      return (
                        <Pressable
                          key={slot.startTime}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            setSelectedSlot(slot.startTime);
                            setDurationHours(Math.min(3, slot.maxHours));
                          }}
                          style={[styles.slotOption, selected && styles.slotOptionSelected]}
                        >
                          <Text style={[styles.slotText, selected && styles.selectedText]}>{slot.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.helperText}>No openings are listed for this date.</Text>
                )}
                {activeSlot ? (
                  <View style={styles.durationRow}>
                    <Text style={styles.durationLabel}>Session length</Text>
                    {validDurations.map((hours) => (
                      <Pressable
                        key={hours}
                        accessibilityRole="button"
                        accessibilityState={{ selected: safeDuration === hours }}
                        onPress={() => setDurationHours(hours)}
                        style={[styles.durationOption, safeDuration === hours && styles.durationOptionSelected]}
                      >
                        <Text style={[styles.durationText, safeDuration === hours && styles.selectedText]}>
                          {hours} hr{hours === 1 ? '' : 's'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.helperText}>The tutor has not added any available days yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeading title="Price Summary" />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Session fee ({safeDuration || 0} hr{safeDuration === 1 ? '' : 's'})</Text>
              <Text style={styles.priceValue}>{displayPrice}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total due to tutor</Text>
              <Text style={styles.totalValue}>{displayPrice}</Text>
            </View>
            <Text style={styles.helperText}>Pay the tutor directly by QR only after they accept your request.</Text>
          </View>

          <View style={styles.card}>
            <SectionHeading title="Student Reviews" trailing={tutor.reviewCount ? `${tutor.rating ?? ''} / 5.0` : undefined} />
            {reviews.length ? reviews.slice(0, 2).map((review, index) => (
              <View key={review.id || `${review.studentName}-${index}`} style={styles.reviewRow}>
                <View style={styles.reviewAvatar}><Text style={styles.reviewInitial}>{review.studentName?.charAt(0) || 'S'}</Text></View>
                <View style={styles.reviewCopy}>
                  <Text style={styles.reviewName}>{review.studentName || 'Student'}</Text>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
                <Text style={styles.reviewStars}>★★★★★</Text>
              </View>
            )) : (
              <Text style={styles.helperText}>Reviews will appear here after students complete sessions.</Text>
            )}
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes for your tutor (optional)</Text>
            <TextInput
              accessibilityLabel="Notes for your tutor"
              value={notes}
              onChangeText={setNotes}
              placeholder="Share a topic or preparation note"
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={500}
              style={styles.notesInput}
            />
          </View>
          {submitError ? <Text accessibilityRole="alert" style={styles.errorText}>{submitError}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerPrice}>{displayPrice}</Text>
            <Text style={styles.footerCaption}>Session total</Text>
          </View>
          <AppButton
            title="Request Session"
            onPress={handleBook}
            loading={submitting}
            disabled={!activeDate || !activeSlot || !safeDuration || !sessionMode || !hasPrice}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, margin: -spacing.md, backgroundColor: colors.background },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm, backgroundColor: colors.background },
  backButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.heading, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  headerAvatar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.lavender },
  headerAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  headerInitial: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  content: { padding: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availablePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: '#D5F6EF' },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  availableText: { color: colors.successText, fontSize: 10, fontWeight: '700' },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.lavender },
  verifiedText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  tutorCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  tutorRow: { flexDirection: 'row', gap: spacing.md },
  tutorAvatar: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.mint, overflow: 'hidden' },
  tutorImage: { width: 54, height: 54 },
  tutorInitial: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  tutorInfo: { flex: 1, justifyContent: 'center' },
  tutorName: { color: colors.heading, fontSize: 17, fontWeight: '700' },
  tutorSubject: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  ratingValue: { color: colors.text, fontSize: 11, fontWeight: '700' },
  reviewCount: { color: colors.mutedText, fontSize: 10 },
  ratePanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#F3F4F6' },
  rateHeading: { color: colors.text, fontSize: 11, fontWeight: '700' },
  rateSubheading: { marginTop: 2, color: colors.mutedText, fontSize: 9 },
  rateAmount: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  card: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.heading, fontSize: 14, fontWeight: '700' },
  sectionTrailing: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  courseIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: colors.lavender },
  courseCopy: { flex: 1 },
  courseName: { color: colors.text, fontSize: 11, fontWeight: '700' },
  courseGrade: { marginTop: 2, color: colors.successText, fontSize: 9 },
  helperText: { color: colors.mutedText, fontSize: 10, lineHeight: 15 },
  modeList: { gap: spacing.xs },
  modeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  modeOptionSelected: { borderColor: colors.primary, backgroundColor: '#F2F0FF' },
  modeCopy: { flex: 1 },
  modeTitle: { color: colors.text, fontSize: 11, fontWeight: '700' },
  modeDescription: { marginTop: 2, color: colors.mutedText, fontSize: 9 },
  dateList: { gap: spacing.xs, paddingBottom: spacing.xs },
  dateChip: { minWidth: 48, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: '#F2F4F6' },
  dateChipSelected: { backgroundColor: '#312E81' },
  dateWeekday: { color: colors.mutedText, fontSize: 8, fontWeight: '600' },
  dateDay: { marginVertical: 2, color: colors.heading, fontSize: 16, fontWeight: '800' },
  dateMonth: { color: colors.mutedText, fontSize: 9 },
  selectedText: { color: colors.white },
  slotList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  slotOption: { minWidth: '31%', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 5, borderRadius: radius.sm, backgroundColor: '#F2F4F6' },
  slotOptionSelected: { backgroundColor: colors.primary },
  slotText: { color: colors.text, fontSize: 10, fontWeight: '600' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  durationLabel: { flex: 1, color: colors.mutedText, fontSize: 10 },
  durationOption: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: '#F2F4F6' },
  durationOptionSelected: { backgroundColor: colors.primary },
  durationText: { color: colors.text, fontSize: 9, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.xs },
  priceLabel: { color: colors.mutedText, fontSize: 10 },
  priceValue: { color: colors.text, fontSize: 11, fontWeight: '600' },
  priceDivider: { height: 1, marginVertical: spacing.xs, backgroundColor: colors.divider },
  totalLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  totalValue: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  reviewAvatar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.peach },
  reviewInitial: { color: colors.text, fontSize: 11, fontWeight: '700' },
  reviewCopy: { flex: 1 },
  reviewName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  reviewText: { marginTop: 2, color: colors.mutedText, fontSize: 9, lineHeight: 13 },
  reviewStars: { color: '#E9A11B', fontSize: 10 },
  notesCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  notesTitle: { marginBottom: spacing.xs, color: colors.heading, fontSize: 11, fontWeight: '700' },
  notesInput: { minHeight: 48, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: 11, textAlignVertical: 'top' },
  errorText: { color: colors.errorText, fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  footerSummary: { minWidth: 78 },
  footerPrice: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  footerCaption: { marginTop: 2, color: colors.mutedText, fontSize: 9 },
});
