import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { mockMentorApplication } from '../../data/mockMentorApplication';
import { mockTutorSessions } from '../../data/mockTutorWorkspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const week = [
  ['Mon', '2 slots', true],
  ['Tue', '3 slots', false],
  ['Wed', '3 slots', true],
  ['Thu', '1 slot', false],
  ['Fri', '2 slots', true],
];

const requests = [
  { name: 'Devon Miller', course: 'CS 240', detail: '1:1 session', amount: 'P280.00', tone: 'primary' },
  { name: 'Samantha Rios', course: 'MATH 215', detail: 'Review session', amount: 'P230.00', tone: 'secondary' },
];

function SectionTitle({ title, subtitle, action }) {
  return (
    <View style={styles.sectionTitle}>
      <View>
        <Text style={styles.sectionHeading}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function Badge({ children }) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{children}</Text></View>;
}

function RequestCard({ request }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestAvatar}><Text style={styles.requestInitial}>{request.name.charAt(0)}</Text></View>
      <View style={styles.requestCopy}>
        <Text style={styles.requestName}>{request.name}</Text>
        <Text style={styles.requestMeta}>{request.course} · {request.detail}</Text>
        <Text style={styles.requestNote}>“Looking for help with this week's problem set.”</Text>
      </View>
      <Text style={styles.requestAmount}>+{request.amount}</Text>
    </View>
  );
}

export default function TutorWorkspaceProfileScreen() {
  const { tutor, courses, preferredDays, preferredTimeSlots } = mockMentorApplication;
  const { signOutDemo } = useAuth();
  const [instantHelp, setInstantHelp] = useState(true);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.activeBanner}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Tutor Workspace Active</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{tutor.name.charAt(0)}</Text><View style={styles.verified}><Ionicons name="checkmark" size={11} color={colors.white} /></View></View>
            <View style={styles.identity}>
              <View style={styles.nameRow}><Text style={styles.name}>{tutor.name}</Text><Badge>Alumni</Badge></View>
              <Text style={styles.education}>B.S. Computer Science '23 · State Univ.</Text>
              <View style={styles.rating}><Ionicons name="star" size={13} color={colors.warning} /><Text style={styles.ratingValue}>5.0</Text><Text style={styles.ratingMeta}>· 5.0 (48 observances)</Text></View>
            </View>
          </View>
          <View style={styles.rateRow}><Text style={styles.rateLabel}>Hourly rate</Text><Text style={styles.rate}>P280.00</Text><Text style={styles.rateUnit}>/session</Text></View>
          <Text style={styles.profileDescription}>Verified tutor profile with {courses.length} approved courses and reliable campus availability.</Text>
          <View style={styles.courseList}>
            {courses.map((course) => <View key={course.id} style={styles.courseRow}><Ionicons name="checkmark-circle" size={16} color={colors.secondary} /><Text style={styles.courseText}>{course.code} {course.title}</Text><Badge>{course.grade}</Badge></View>)}
          </View>
          <Pressable style={styles.addCourse}><Ionicons name="add" size={15} color={colors.primary} /><Text style={styles.addCourseText}>Add Course / Submit Grade Transcript</Text></Pressable>
        </View>

        <SectionTitle title="Schedule & Availability" subtitle="Spring Semester Office Hours" action="Edit Grid" />
        <View style={styles.availabilityCard}>
          <View style={styles.instantRow}>
            <View style={styles.instantIcon}><Ionicons name="flash" size={16} color={colors.secondary} /></View>
            <View style={styles.instantCopy}><Text style={styles.instantTitle}>Accept Instant Help</Text><Text style={styles.instantSubtitle}>Allows 15-min drop-in ping</Text></View>
            <Switch value={instantHelp} onValueChange={setInstantHelp} trackColor={{ false: colors.border, true: colors.secondary }} thumbColor={colors.white} />
          </View>
          <View style={styles.weekRow}>
            {week.map(([day, slots, active]) => <View key={day} style={[styles.day, active && styles.dayActive]}><Text style={[styles.dayName, active && styles.dayNameActive]}>{day}</Text><Text style={styles.daySlots}>{slots}</Text><View style={[styles.dayDot, active && styles.dayDotActive]} /></View>)}
          </View>
          <Text style={styles.availabilityMeta}>{preferredDays.join(' · ')} · {preferredTimeSlots[0]}</Text>
        </View>

        <SectionTitle title="Booking Requests" subtitle="2 pending" action="Requires action" />
        {requests.map((request) => <RequestCard key={request.name} request={request} />)}
        <View style={styles.requestActions}><AppButton title="Accept" variant="secondary" onPress={() => {}} /><AppButton title="Decline" variant="outline" onPress={() => {}} /></View>

        <SectionTitle title="Session Ledger" subtitle="Upcoming (3)" action="Past (42)" />
        {mockTutorSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={[styles.sessionAccent, { backgroundColor: session.accent }]} />
            <View style={styles.sessionCopy}><View style={styles.sessionTop}><Text style={styles.sessionStatus}>{session.status}</Text><Text style={styles.sessionTime}>{session.date} · {session.time}</Text></View><Text style={styles.sessionName}>{session.studentName}</Text><Text style={styles.sessionMeta}>{session.subject} · {session.location}</Text><Text style={styles.sessionAction}><Ionicons name="chatbubble-outline" size={13} color={colors.primary} /> Message <Text style={styles.sessionActionMuted}>              Reschedule</Text></Text></View>
          </View>
        ))}

        <AppButton title="Log Out" variant="danger" onPress={signOutDemo} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  activeBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E6E8EA' },
  activeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6, backgroundColor: colors.secondary },
  activeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  profileCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, shadowColor: colors.black, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  profileRow: { flexDirection: 'row', gap: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  verified: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  identity: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  education: { marginTop: 3, color: colors.mutedText, fontSize: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  ratingValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  ratingMeta: { color: colors.mutedText, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.lavender },
  badgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md },
  rateLabel: { color: colors.mutedText, fontSize: 11, flex: 1 },
  rate: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  rateUnit: { color: colors.mutedText, fontSize: 11 },
  profileDescription: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 11, lineHeight: 16 },
  courseList: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  courseText: { flex: 1, color: colors.text, fontSize: 11 },
  addCourse: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.background },
  addCourseText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeading: { color: colors.heading, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  sectionAction: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  availabilityCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  instantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  instantIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  instantCopy: { flex: 1 },
  instantTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  instantSubtitle: { marginTop: 2, color: colors.mutedText, fontSize: 11 },
  weekRow: { flexDirection: 'row', gap: 5, marginTop: spacing.md },
  day: { flex: 1, alignItems: 'center', padding: 7, borderRadius: 8, backgroundColor: colors.background },
  dayActive: { backgroundColor: '#E2DFFF' },
  dayName: { color: colors.mutedText, fontSize: 10, fontWeight: '700' },
  dayNameActive: { color: colors.primary },
  daySlots: { marginTop: 4, color: colors.mutedText, fontSize: 9 },
  dayDot: { width: 6, height: 6, marginTop: 5, borderRadius: 3, backgroundColor: colors.border },
  dayDotActive: { backgroundColor: colors.primary },
  availabilityMeta: { marginTop: spacing.sm, color: colors.mutedText, fontSize: 10 },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  requestAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  requestInitial: { color: colors.primary, fontWeight: '700' },
  requestCopy: { flex: 1 },
  requestName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  requestMeta: { marginTop: 2, color: colors.mutedText, fontSize: 10 },
  requestNote: { marginTop: 4, color: colors.mutedText, fontSize: 9, fontStyle: 'italic' },
  requestAmount: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  sessionCard: { flexDirection: 'row', marginBottom: spacing.sm, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surface },
  sessionAccent: { width: 5 },
  sessionCopy: { flex: 1, padding: spacing.sm },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionStatus: { color: colors.successText, fontSize: 9, fontWeight: '700' },
  sessionTime: { color: colors.mutedText, fontSize: 9 },
  sessionName: { marginTop: 4, color: colors.text, fontSize: 12, fontWeight: '700' },
  sessionMeta: { marginTop: 3, color: colors.mutedText, fontSize: 10 },
  sessionAction: { marginTop: 7, color: colors.primary, fontSize: 10, fontWeight: '700' },
  sessionActionMuted: { color: colors.mutedText, fontWeight: '400' },
});
