import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import { mockMentorApplication } from '../../data/mockMentorApplication';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const badges = [
  { icon: 'ribbon-outline', label: 'Top Rated', detail: '4.9 average rating' },
  { icon: 'school-outline', label: 'CS Mentor', detail: '18 sessions completed' },
  { icon: 'flame-outline', label: 'Reliable', detail: '100% attendance' },
];

export default function TutorWorkspaceProfileScreen() {
  const { tutor, courses, preferredDays, preferredTimeSlots } = mockMentorApplication;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{tutor.name.charAt(0)}</Text></View>
          <Text style={styles.eyebrow}>Tutor profile</Text>
          <Text style={styles.name}>{tutor.name}</Text>
          <Text style={styles.subject}>{tutor.subject}</Text>
          <View style={styles.rating}><Ionicons name="star" size={15} color={colors.warning} /><Text style={styles.ratingText}>4.9 · 24 student ratings</Text></View>
        </View>

        <SectionTitle title="Your badges" />
        <View style={styles.badgeGrid}>
          {badges.map((badge) => (
            <View key={badge.label} style={styles.badgeCard}>
              <View style={styles.badgeIcon}><Ionicons name={badge.icon} size={20} color={colors.primary} /></View>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={styles.badgeDetail}>{badge.detail}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Top-rated tutors" action="Leaderboard" />
        {['Marcus Chen', 'Dr. Francis Xavier', tutor.name].map((name, index) => (
          <View key={name} style={styles.leaderRow}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.leaderAvatar}><Text style={styles.leaderInitial}>{name.charAt(0)}</Text></View>
            <Text style={styles.leaderName}>{name}</Text>
            <Text style={styles.leaderScore}>{index === 2 ? '4.9' : ['5.0', '4.9'][index]} ★</Text>
          </View>
        ))}

        <SectionTitle title="Teaching details" />
        <View style={styles.card}>
          <InfoRow icon="book-outline" label="Courses" value={`${courses.length} verified courses`} />
          <InfoRow icon="calendar-outline" label="Available" value={preferredDays.join(' · ')} />
          <InfoRow icon="time-outline" label="Hours" value={preferredTimeSlots.join(' · ')} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ title, action }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{action ? <Text style={styles.sectionAction}>{action}</Text> : null}</View>;
}

function InfoRow({ icon, label, value }) {
  return <View style={styles.infoRow}><Ionicons name={icon} size={18} color={colors.primary} /><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  eyebrow: { marginTop: spacing.md, color: colors.mutedText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  name: { marginTop: spacing.xs, color: colors.heading, fontSize: 22, fontWeight: '700' },
  subject: { marginTop: 3, color: colors.mutedText, fontSize: 13 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  ratingText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeading: { color: colors.heading, fontSize: 15, fontWeight: '700' },
  sectionAction: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  badgeGrid: { flexDirection: 'row', gap: spacing.sm },
  badgeCard: { flex: 1, minHeight: 112, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  badgeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  badgeLabel: { marginTop: spacing.sm, color: colors.heading, fontSize: 11, fontWeight: '700' },
  badgeDetail: { marginTop: 3, color: colors.mutedText, fontSize: 10, lineHeight: 14 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  rank: { width: 18, color: colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  leaderAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  leaderInitial: { color: colors.primary, fontWeight: '700' },
  leaderName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' },
  leaderScore: { color: colors.warningText, fontSize: 11, fontWeight: '700' },
  card: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  infoLabel: { width: 64, color: colors.mutedText, fontSize: 11 },
  infoValue: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});
