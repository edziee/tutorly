import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import { mockTutorSessions } from '../../data/mockTutorWorkspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function TutorScheduleScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthRow}><Ionicons name="chevron-back" size={18} color={colors.text} /><Text style={styles.month}>October 2024</Text><Ionicons name="chevron-forward" size={18} color={colors.text} /><Text style={styles.view}>Agenda</Text></View>
        <View style={styles.week}><Text>Sun 15</Text><Text>Mon 16</Text><Text>Tue 17</Text><Text style={styles.selected}>Wed 18</Text><Text>Thu 19</Text><Text>Fri 20</Text><Text>Sat 21</Text></View>
        <View style={styles.filter}><Text style={styles.filterActive}>All students 3</Text><Text>Upcoming 2</Text><Text>Past 1</Text></View>
        <Text style={styles.heading}>Upcoming sessions</Text>
        {mockTutorSessions.map((session) => (
          <View key={session.id} style={[styles.session, { borderTopColor: session.accent }]}>
            <View style={styles.sessionTop}><Text style={styles.date}>{session.date}</Text><Text style={[styles.status, session.status === 'Completed' && styles.completed]}>{session.status}</Text></View>
            <Text style={styles.subject}>{session.subject}</Text>
            <Text style={styles.student}><Ionicons name="person-outline" size={14} color={colors.mutedText} /> {session.studentName}</Text>
            <Text style={styles.meta}><Ionicons name="time-outline" size={14} color={colors.mutedText} /> {session.time}</Text>
            <Text style={styles.meta}><Ionicons name="location-outline" size={14} color={colors.mutedText} /> {session.location}</Text>
            {session.status === 'Upcoming' ? <Text style={styles.action}><Ionicons name="chatbubble-outline" size={14} color={colors.primary} /> Message student</Text> : null}
          </View>
        ))}
        <Text style={styles.heading}>Past students</Text>
        <Text style={styles.helper}>Completed sessions and student notes stay here for quick reference.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  month: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  view: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 12, color: colors.primary, backgroundColor: colors.lavender, fontSize: 10, fontWeight: '700' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  weekText: { color: colors.mutedText, fontSize: 10 },
  selected: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 10, color: colors.white, backgroundColor: colors.primary, fontWeight: '700' },
  filter: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  filterActive: { color: colors.white, backgroundColor: colors.primary, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 14, fontSize: 10, fontWeight: '700' },
  filter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md, color: colors.mutedText, fontSize: 10 },
  heading: { marginTop: spacing.sm, marginBottom: spacing.sm, color: colors.heading, fontSize: 15, fontWeight: '700' },
  session: { marginBottom: spacing.sm, padding: spacing.md, borderTopWidth: 4, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: colors.mutedText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  status: { color: colors.successText, fontSize: 10, fontWeight: '700' },
  completed: { color: colors.mutedText },
  subject: { marginTop: spacing.sm, color: colors.heading, fontSize: 15, fontWeight: '700' },
  student: { marginTop: spacing.xs, color: colors.text, fontSize: 12, fontWeight: '600' },
  meta: { marginTop: spacing.xs, color: colors.mutedText, fontSize: 11 },
  action: { marginTop: spacing.md, color: colors.primary, fontSize: 11, fontWeight: '700' },
  helper: { color: colors.mutedText, fontSize: 12, lineHeight: 18 },
});
