import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import { mockReviewedApplications } from '../../data/mockTutorWorkspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function AdminReviewHistoryScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Review history</Text>
        <Text style={styles.helper}>Approved and rejected tutor applications.</Text>
        {mockReviewedApplications.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.icon}><Ionicons name={item.status === 'Approved' ? 'checkmark' : 'close'} size={18} color={item.status === 'Approved' ? colors.successText : colors.errorText} /></View>
            <View style={styles.copy}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.type} · {item.course}</Text></View>
            <View><Text style={[styles.status, item.status === 'Rejected' && styles.rejected]}>{item.status}</Text><Text style={styles.date}>{item.date}</Text></View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  heading: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  helper: { marginTop: 4, marginBottom: spacing.lg, color: colors.mutedText, fontSize: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender },
  copy: { flex: 1 },
  name: { color: colors.heading, fontSize: 13, fontWeight: '700' },
  detail: { marginTop: 3, color: colors.mutedText, fontSize: 11 },
  status: { color: colors.successText, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  rejected: { color: colors.errorText },
  date: { marginTop: 3, color: colors.mutedText, fontSize: 10, textAlign: 'right' },
});
