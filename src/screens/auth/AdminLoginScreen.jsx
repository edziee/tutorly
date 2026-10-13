// Admin login screen. During screen review, it creates a local demo admin
// without requiring an account.
// Layout: Member 3 (designs it in Figma in Week 1).   Logic: Member 1
// (authService.signInAdmin).
// Plan task: "Build the hidden admin login (no public sign-up; admin accounts
// created by the team in Firebase)" (Member 1, Week 2).
//
// It is registered in AuthNavigator but not linked from the login screen.
// Member 3 and Member 1 agree on how the team reaches it, for example a
// long press on the logo. Hiding the screen is not security: the real
// protection is the role check in signInAdmin and the Firestore rules.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthHeader from '../../components/AuthHeader';
import Card from '../../components/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signInDemo } = useAuth();

  function submit() {
    setSubmitting(true);
    setError('');
    signInDemo('admin');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <AuthHeader subtitle="Restricted access for Tutorly reviewers." />
          <Card style={styles.card}>
            <Text style={styles.title}>Admin sign in</Text>
            <Text style={styles.helper}>Review tutor applications and history.</Text>
            <AppInput label="Admin email" value={email} handleChangeText={setEmail} placeholder="admin@tutorly.edu" keyboardType="email-address" autoCapitalize="none" error={error && !email ? error : ''} />
            <AppInput label="Password" value={password} handleChangeText={setPassword} placeholder="Your password" secureTextEntry autoCapitalize="none" error={error && email ? error : ''} />
            <AppButton title="Sign in" onPress={submit} loading={submitting} />
            <Text onPress={() => navigation.goBack()} style={styles.back}>Back to sign in</Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  card: { padding: spacing.lg },
  title: { color: colors.heading, fontSize: 18, fontWeight: '700' },
  helper: { marginTop: spacing.xs, marginBottom: spacing.lg, color: colors.mutedText, fontSize: 12 },
  back: { marginTop: spacing.lg, color: colors.primary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
