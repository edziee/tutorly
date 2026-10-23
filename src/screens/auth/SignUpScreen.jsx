// Sign-up screen for students, tutors and professional tutors.
// Layout: Member 3 (matches the Figma "SignUp/Login Portal (STUDENT)" sign-up frame).
// Sign-up logic: Member 1 (authService.signUp).
// Plan tasks: "Build the UI for login and sign-up" (Member 3, Week 1) and
// "Build the professional tutor login logic ... with its verification
// documents" (Member 1, Week 2).
//
// What this screen does: it validates the form and calls
//   authService.signUp({ email, password, role, profile: { name, campusId } })
// Only the roles in SIGNUP_ROLES (src/constants/roles.js) are offered, and an
// admin account can never be created here. Like the login screen, it does not
// navigate afterwards: AuthContext notices the new account.
//
// Choosing "Tutor" shows a second switch: Peer Tutor or Professor / Alumni.
// Both choices create a 'tutor' account; Professor / Alumni do not need a campus ID.
//
// Tutor type is saved at sign-up. Applicants submit Google Drive proof links
// later through the tutor application; file bytes are not uploaded to Firebase.
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
import Checkbox from '../../components/Checkbox';
import RoleCard from '../../components/RoleCard';
import SegmentedControl from '../../components/SegmentedControl';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { TUTOR_TYPES } from '../../constants/statuses';
import { ROUTES } from '../../constants/routes';
import { signUp } from '../../services/authService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { getAuthErrorMessage } from '../../utils/errors';
import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword, validateRequired } from '../../utils/validation';

const modeOptions = [
  { value: 'signIn', label: 'Sign in' },
  { value: 'signUp', label: 'Create account' },
];

const tutorKindOptions = [
  { value: TUTOR_TYPES.PEER, label: 'Peer Tutor' },
  { value: TUTOR_TYPES.PROFESSIONAL, label: 'Professor / Alumni' },
];

// What each consent covers, from the Figma "Academic Permissions & Privacy Consent" box.
const disclosures = [
  {
    icon: 'navigate-outline',
    title: 'Precise location',
    text: ' used for campus checks and session check-ins.',
  },
  {
    icon: 'globe-outline',
    title: 'IP address',
    text: ' recorded to help protect your account and the network.',
  },
  {
    icon: 'school-outline',
    title: 'Academic records and personal details',
    text: ' used to confirm tutor qualifications.',
  },
];

export default function SignUpScreen({ navigation, route }) {
  const requestedRole = route?.params?.role;
  const [portal, setPortal] = useState(
    requestedRole && requestedRole !== ROLES.STUDENT ? ROLES.TUTOR : ROLES.STUDENT,
  );
  const [tutorKind, setTutorKind] = useState(
    requestedRole === ROLES.PROFESSIONAL ? TUTOR_TYPES.PROFESSIONAL : TUTOR_TYPES.PEER,
  );
  const [name, setName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPermissions, setAcceptedPermissions] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isStudent = portal === ROLES.STUDENT;
  const role = isStudent ? ROLES.STUDENT : ROLES.TUTOR;
  // Professors and alumni may not have a campus ID number, so it is optional for them.
  const campusIdRequired = isStudent || tutorKind !== TUTOR_TYPES.PROFESSIONAL;

  const handleSubmit = async () => {
    const nextErrors = {
      name: validateRequired(name, 'your full name'),
      campusId: campusIdRequired ? validateRequired(campusId, 'your campus ID number') : '',
      email: validateEmail(email),
      password: validatePassword(password),
      terms: acceptedTerms ? '' : 'Agree to the Terms and Charter to continue.',
      permissions: acceptedPermissions ? '' : 'Allow these permissions to create your account.',
    };
    setErrors(nextErrors);
    setFormError('');
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        role,
        profile: {
          name: name.trim(),
          campusId: campusId.trim(),
          ...(!isStudent ? { tutorType: tutorKind } : {}),
        },
      });
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
          <AuthHeader subtitle="Join Tutorly to learn or teach on campus." />

          <SegmentedControl
            options={modeOptions}
            value="signUp"
            onChange={(value) => {
              if (value === 'signIn') navigation.navigate(ROUTES.LOGIN, { role: portal });
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
          {!isStudent ? (
            <View style={styles.tutorKind}>
              <SegmentedControl
                options={tutorKindOptions}
                value={tutorKind}
                onChange={setTutorKind}
              />
            </View>
          ) : null}

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
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="next"
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
            <AppInput
              label="Full name"
              value={name}
              handleChangeText={setName}
              placeholder="Name on your campus ID"
              error={errors.name}
              leftIcon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
            <AppInput
              label={
                campusIdRequired
                  ? 'University NetID / Campus ID Number'
                  : 'University NetID / Campus ID Number (optional)'
              }
              value={campusId}
              handleChangeText={setCampusId}
              placeholder="e.g. 251226969"
              error={errors.campusId}
              leftIcon="finger-print-outline"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />

            <View style={styles.consentBox}>
              <View style={styles.consentHeader}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={styles.consentTitle}>Privacy and permissions</Text>
              </View>
              {disclosures.map((item) => (
                <View key={item.title} style={styles.disclosure}>
                  <Ionicons name={item.icon} size={14} color={colors.successText} />
                  <Text style={styles.disclosureText}>
                    <Text style={styles.disclosureTitle}>{item.title}</Text>
                    {item.text}
                  </Text>
                </View>
              ))}
              <View style={styles.checkboxes}>
                <Checkbox
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                  error={errors.terms}
                >
                  <Text style={styles.checkboxText}>
                    I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
                    <Text style={styles.link}>Campus Academic Charter</Text>.
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={acceptedPermissions}
                  onChange={setAcceptedPermissions}
                  error={errors.permissions}
                >
                  <Text style={styles.checkboxText}>
                    I allow Tutorly to use my <Text style={styles.link}>precise location</Text> for campus
                    check-ins, record my <Text style={styles.link}>IP address</Text> for security,
                    and review my <Text style={styles.link}>academic records</Text> to verify tutor
                    qualifications.
                  </Text>
                </Checkbox>
              </View>
            </View>

            {formError ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.formError}>
                <Ionicons name="alert-circle" size={16} color={colors.errorText} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <AppButton
              title={`Create ${ROLE_LABELS[role]} account`}
              onPress={handleSubmit}
              loading={submitting}
            />
          </Card>
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
    marginBottom: spacing.md,
  },
  tutorKind: {
    marginBottom: spacing.md,
  },
  formCard: {
    marginTop: spacing.xs,
    padding: spacing.lg + 4,
    borderRadius: radius.lg + 2,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  consentBox: {
    marginBottom: spacing.lg,
    padding: spacing.md + 3,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  consentTitle: {
    flex: 1,
    color: colors.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  disclosureText: {
    flex: 1,
    color: colors.mutedText,
    fontSize: 11,
    lineHeight: 17,
  },
  disclosureTitle: {
    color: colors.heading,
    fontWeight: '700',
  },
  checkboxes: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  checkboxText: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 17,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
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
});
