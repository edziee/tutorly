// Login screen for students, tutors and professional tutors.
// Layout: Member 3 (matches the Figma "SignUp/Login Portal (STUDENT)" frame).
// Login logic: Member 1 (authService.signIn).
// Plan tasks: "Build the UI for login and sign-up" (Member 3, Week 1) and
// "Sign-up and login logic for students and tutors" (Member 1, Week 1).
//
// The Student / Tutor cards choose the portal. Tutors and professional tutors
// both use "Tutor"; signIn checks the account role matches the selected portal.
// The role can be passed in with
// navigation.navigate(ROUTES.LOGIN, { role: 'tutor' }).
//
// Hidden admin login: a long press (1.5 seconds) on the logo opens it. There is
// no visible link. This is a proposal, agree it with Member 1.
//
// Not built because there is no service function for it yet: "Log in with
// Google" and "Forgot password?" from the Figma design.
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthHeader from '../../components/AuthHeader';
import Card from '../../components/Card';
import RoleCard from '../../components/RoleCard';
import SegmentedControl from '../../components/SegmentedControl';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { signIn } from '../../services/authService';
import { getAuthErrorMessage } from '../../utils/errors';
import { validateEmail, validatePasswordPresent } from '../../utils/validation';

const modeOptions = [
  { value: 'signIn', label: 'Sign in' },
  { value: 'signUp', label: 'Create account' },
];

export default function LoginScreen({ navigation, route }) {
  const requestedRole = route?.params?.role;
  const [portal, setPortal] = useState(
    requestedRole && requestedRole !== ROLES.STUDENT ? ROLES.TUTOR : ROLES.STUDENT,
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isStudent = portal === ROLES.STUDENT;

  const handleSubmit = async () => {
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
      await signIn(email.trim(), password, portal);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            subtitle="Find a tutor, manage sessions, or share what you know."
            onLogoLongPress={() => navigation.navigate(ROUTES.ADMIN_LOGIN)}
          />

          <SegmentedControl
            options={modeOptions}
            value="signIn"
            onChange={(value) => {
              if (value === 'signUp') navigation.navigate(ROUTES.SIGN_UP, { role: portal });
            }}
          />

          <Text style={styles.sectionLabel}>I want to...</Text>
          <View style={styles.roleRow}>
            <RoleCard
              title="Student"
              description="Find a tutor and get help with your studies."
              badge="Learn"
              icon="school"
              selected={isStudent}
              onPress={() => setPortal(ROLES.STUDENT)}
            />
            <RoleCard
              title="Tutor"
              description="Share your knowledge with other students."
              badge="Teach"
              icon="ribbon"
              selected={!isStudent}
              onPress={() => setPortal(ROLES.TUTOR)}
            />
          </View>

          <Card style={styles.formCard}>
            <AppInput
              label="University email"
              value={email}
              handleChangeText={setEmail}
              placeholder="qjdoe@tip.edu.ph"
              error={errors.email}
              leftIcon="at"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />
            <AppInput
              label="Password"
              value={password}
              handleChangeText={setPassword}
              placeholder="Your password"
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              rightElement={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={8}
                  onPress={() => setShowPassword((visible) => !visible)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>
              }
            />

            {formError ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.formError}>
                <Ionicons name="alert-circle" size={16} color={colors.errorText} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <AppButton
              title="Sign in"
              onPress={handleSubmit}
              loading={submitting}
            />
          </Card>

          <Pressable onPress={() => navigation.navigate(ROUTES.ADMIN_LOGIN)} hitSlop={10}>
            <Text style={styles.adminLink}>Admin sign in</Text>
          </Pressable>
          <Text style={styles.footer}>Terms of Service  •  Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  formCard: {
    padding: spacing.lg + 4,
    borderRadius: radius.lg + 2,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorBackground,
  },
  formErrorText: {
    flex: 1,
    color: colors.errorText,
    fontSize: 13,
  },
  footer: {
    marginTop: spacing.xl,
    color: colors.mutedText,
    fontSize: 11,
    textAlign: 'center',
  },
  adminLink: {
    marginTop: spacing.lg,
    color: colors.mutedText,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.55,
  },
});
