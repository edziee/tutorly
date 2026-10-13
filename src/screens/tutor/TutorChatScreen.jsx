import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import { mockTutorStudents } from '../../data/mockTutorWorkspace';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function TutorChatScreen() {
  const [search, setSearch] = useState('');
  const students = useMemo(() => mockTutorStudents.filter((student) => `${student.name} ${student.course}`.toLowerCase().includes(search.toLowerCase())), [search]);
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.search}><Ionicons name="search-outline" size={18} color={colors.mutedText} /><TextInput value={search} onChangeText={setSearch} placeholder="Search students or courses" placeholderTextColor={colors.mutedText} style={styles.input} /></View>
        <Text style={styles.heading}>Students</Text>
        {students.map((student) => (
          <Pressable key={student.id} style={styles.card} onPress={() => Alert.alert(student.name, 'Conversation view will open here.')}>
            <View style={[styles.avatar, { backgroundColor: student.color }]}><Text style={styles.initials}>{student.initials}</Text></View>
            <View style={styles.copy}><View style={styles.top}><Text style={styles.name}>{student.name}</Text><Text style={styles.time}>{student.time}</Text></View><Text style={styles.course}>{student.course}</Text><Text numberOfLines={1} style={styles.preview}>{student.preview}</Text><Text style={styles.session}>{student.session}</Text></View>
          </Pressable>
        ))}
        {!students.length ? <Text style={styles.empty}>No students match this search.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: spacing.md },
  heading: { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.heading, fontSize: 15, fontWeight: '700' },
  card: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: 12, backgroundColor: colors.surface },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontSize: 13, fontWeight: '700' },
  copy: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  time: { color: colors.mutedText, fontSize: 9 },
  course: { marginTop: 3, color: colors.primary, fontSize: 10, fontWeight: '600' },
  preview: { marginTop: 4, color: colors.mutedText, fontSize: 11 },
  session: { marginTop: 4, color: colors.mutedText, fontSize: 10 },
  empty: { paddingVertical: spacing.xl, color: colors.mutedText, textAlign: 'center' },
});
