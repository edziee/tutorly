// Admin login screen. Admin accounts are created by the team in Firebase.
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
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthHeader from '../../components/AuthHeader';
import Card from '../../components/Card';
import { signInAdmin } from '../../services/authService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getAuthErrorMessage } from '../../utils/errors';
import { validateEmail, validatePasswordPresent } from '../../utils/validation';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;

    const nextErrors = {
      email: validateEmail(email),
      password: validatePasswordPresent(password),
    };
    setErrors(nextErrors);
    setFormError('');
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signInAdmin(email.trim(), password);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader subtitle="For Tutorly reviewers." />
          <Card style={styles.card}>
            <Text style={styles.title}>Admin sign in</Text>
            <Text style={styles.helper}>Review tutor applications.</Text>
            <AppInput
              label="Email"
              value={email}
              handleChangeText={setEmail}
              placeholder="admin@tutorly.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <AppInput
              label="Password"
              value={password}
              handleChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
              onSubmitEditing={submit}
              rightElement={(
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  accessibilityHint="Toggles password visibility."
                  accessibilityState={{ selected: passwordVisible }}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>
              )}
            />
            {formError ? (
              <Text accessibilityRole="alert" style={styles.formError}>
                {formError}
              </Text>
            ) : null}
            <AppButton title="Sign in" onPress={submit} loading={submitting} />
            <View style={styles.backAction}>
              <AppButton
                title="Back"
                variant="outline"
                onPress={() => navigation.goBack()}
              />
            </View>
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
  title: { ...typography.heading },
  helper: { ...typography.bodySmall, marginTop: spacing.xs, marginBottom: spacing.lg },
  formError: { ...typography.bodySmall, color: colors.errorText, marginBottom: spacing.md },
  passwordToggle: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  backAction: { marginTop: spacing.sm },
});
