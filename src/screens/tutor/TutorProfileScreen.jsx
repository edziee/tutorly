import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/AppButton';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import StudentAvatar from '../../components/StudentAvatar';
import VerificationBadge from '../../components/VerificationBadge';
import { ROLES } from '../../constants/roles';
import { TUTOR_TIERS, TUTOR_TYPES } from '../../constants/statuses';
import { useAuth } from '../../context/AuthContext';
import { getTutorApplication, saveTutorApplication } from '../../services/tutorService';
import { colors } from '../../theme/colors';
import styles from '../../theme/tutorProfileScreenStyles';
import { getErrorMessage } from '../../utils/errors';
import {
  getTutorApplicationEvidenceError,
  getTutorCourseValidationError,
} from '../../utils/validation';

const gradeOptions = ['1.00', '1.25', '1.50'];
const tutoringDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const tutoringTimeSlots = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'];

function createCourseId() {
  return `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function Section({ children, style }) {
  return <View style={[styles.section, style]}>{children}</View>;
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <Text style={styles.fieldLabel}>
      {children} {required ? <Text style={styles.required}>*</Text> : null}
    </Text>
  );
}

function MentorHeader({ tutor, statusLabel, imageUri, approved }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTopLine}>
        <StudentAvatar imageUri={imageUri} name={tutor.name} size={48} />
        <View style={styles.heroIdentity}>
          <Text style={styles.eyebrow}>Tutor Profile</Text>
          <Text style={styles.heroName}>{tutor.name}</Text>
          <Text style={styles.heroSubject}>{tutor.subject}</Text>
        </View>
        {approved ? (
          <VerificationBadge />
        ) : (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        )}
      </View>
      <View style={styles.heroRule} />
      <Text style={styles.heroCopy}>
        Add a few details so students can find you.
      </Text>
    </View>
  );
}

function EligibilityCard({ tutorType }) {
  if (tutorType === TUTOR_TYPES.PROFESSIONAL) {
    return (
      <View style={styles.eligibilityCard}>
        <View style={styles.eligibilityIcon}>
          <Ionicons name="ribbon-outline" size={18} color={colors.error} />
        </View>
        <View style={styles.eligibilityCopy}>
          <Text style={styles.eligibilityTitle}>Professional tutor requirements</Text>
          <Text style={styles.eligibilityBody}>
            List each course you teach. Grades are optional. Add proof details and a Google Drive link for your application.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.eligibilityCard}>
      <View style={styles.eligibilityIcon}>
        <Ionicons name="ribbon-outline" size={18} color={colors.error} />
      </View>
      <View style={styles.eligibilityCopy}>
        <Text style={styles.eligibilityTitle}>Peer tutor requirements</Text>
        <Text style={styles.eligibilityBody}>
          To tutor a course, you need a final grade from 1.00 to 1.50.
        </Text>
        <View style={styles.thresholdBox}>
          <View style={styles.thresholdHeader}>
            <Text style={styles.thresholdLabel}>Grade range</Text>
            <Text style={styles.thresholdValue}>Highest eligible grade: 1.50</Text>
          </View>
          <View style={styles.thresholdBar}>
            <View style={[styles.thresholdSegment, styles.thresholdLow]} />
            <View style={[styles.thresholdSegment, styles.thresholdMid]} />
            <View style={[styles.thresholdSegment, styles.thresholdHigh]} />
            <View style={[styles.thresholdSegment, styles.thresholdDisabled]} />
          </View>
          <View style={styles.thresholdScale}>
            <Text style={styles.scaleText}>1.00{`\n`}Exceptional</Text>
            <Text style={styles.scaleText}>1.25{`\n`}Superior</Text>
            <Text style={[styles.scaleText, styles.scaleActive]}>1.50{`\n`}Cutoff</Text>
            <Text style={[styles.scaleText, styles.scaleDisabled]}>≥ 1.75{`\n`}Ineligible</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function CourseRow({ course, onRemove, tutorType }) {
  return (
    <View style={styles.courseRow}>
      <View style={styles.courseIcon}>
        <Ionicons name="school-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.courseDetails}>
        <Text style={styles.courseCode}>{course.code}</Text>
        <Text style={styles.courseTitle}>{course.title}</Text>
        {tutorType === TUTOR_TYPES.PEER ? (
          <Text style={styles.proofText}>
            <Ionicons name="document-attach-outline" size={12} color={colors.secondary} />{' '}
            Grade {course.grade} · Proof: {course.proofName}
          </Text>
        ) : course.grade ? (
          <Text style={styles.proofText}>Grade provided (optional): {course.grade}</Text>
        ) : null}
      </View>
      <View style={styles.courseStatus}>
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${course.code}`}>
          <Ionicons name="trash-outline" size={16} color={colors.mutedText} />
        </Pressable>
        <Text style={styles.courseReady}>
          {tutorType === TUTOR_TYPES.PEER ? `Proof${'\n'}added` : `Course${'\n'}added`}
        </Text>
      </View>
    </View>
  );
}

function CourseForm({ onAdd, tutorType }) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const isPeerTutor = tutorType === TUTOR_TYPES.PEER;

  function addCourse() {
    const course = {
      id: createCourseId(),
      code: code.trim().toUpperCase(),
      title: title.trim(),
      grade: grade.trim(),
      ...(isPeerTutor ? { proofName: proofName.trim(), proofUrl: proofUrl.trim() } : {}),
    };
    const validationError = getTutorCourseValidationError(tutorType, course);
    if (validationError) {
      Alert.alert(isPeerTutor ? 'Check this course' : 'Course details needed', validationError);
      return;
    }
    onAdd(course);
    setCode('');
    setTitle('');
    setGrade('');
    setProofName('');
    setProofUrl('');
  }

  return (
    <View style={styles.courseForm}>
      <View style={styles.addCourseHeading}>
        <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
        <Text style={styles.addCourseText}>Add a course</Text>
        {isPeerTutor ? (
          <Text style={styles.gradeScaleText}>Grade cutoff: 1.00–1.50</Text>
        ) : null}
      </View>
      <FieldLabel required>Course code or subject</FieldLabel>
      <View style={styles.inputWithIcon}>
        <Ionicons name="book-outline" size={17} color={colors.mutedText} />
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="e.g., CS 201 or MATH 110"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
        />
      </View>
      <FieldLabel required={isPeerTutor}>
        Final grade{isPeerTutor ? '' : ' (optional)'}
      </FieldLabel>
      <View style={styles.inputWithIcon}>
        <Ionicons name="star-outline" size={17} color={colors.mutedText} />
        <TextInput
          value={grade}
          onChangeText={setGrade}
          placeholder={isPeerTutor ? '1.00 - 1.50' : 'Optional'}
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>
      {isPeerTutor ? (
        <>
          <Text style={styles.fieldLabel}>Choose a grade</Text>
          <View style={styles.gradeOptions}>
            {gradeOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setGrade(option)}
                style={[styles.gradeOption, grade === option && styles.gradeOptionActive]}
              >
                <Text style={[styles.gradeOptionText, grade === option && styles.gradeOptionTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <FieldLabel required>Course title</FieldLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Discrete Mathematics"
        placeholderTextColor={colors.placeholder}
        style={styles.textInput}
      />
      {isPeerTutor ? (
        <>
          <FieldLabel required>Proof document name</FieldLabel>
          <TextInput
            value={proofName}
            onChangeText={setProofName}
            placeholder="e.g., CS 201 transcript"
            placeholderTextColor={colors.placeholder}
            style={styles.textInput}
          />
          <FieldLabel required>Google Drive link</FieldLabel>
          <TextInput
            value={proofUrl}
            onChangeText={setProofUrl}
            placeholder="https://drive.google.com/file/d/..."
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.textInput}
          />
        </>
      ) : null}
      <Text style={styles.fieldLabel}>
        {isPeerTutor
          ? 'Add a Google Drive proof link for each course. Tutorly stores the link, not the file.'
          : 'Add the courses you want to tutor. You’ll add your professional proof below.'}
      </Text>
      <Pressable style={styles.addButton} onPress={addCourse}>
        <Ionicons name="add" size={18} color={colors.white} />
        <Text style={styles.addButtonText}>Add course</Text>
      </Pressable>
    </View>
  );
}

export default function TutorApplicationScreen() {
  const { user } = useAuth();
  const isStudentApplicant = user?.role === ROLES.STUDENT;
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('not_submitted');
  const [tutorType, setTutorType] = useState(
    isStudentApplicant ? TUTOR_TYPES.PEER : user?.tutorType ?? TUTOR_TYPES.PEER,
  );
  const [needsTutorTypeChoice, setNeedsTutorTypeChoice] = useState(false);
  const [tier, setTier] = useState(TUTOR_TIERS.PEER);
  const [courses, setCourses] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [credentials, setCredentials] = useState(['']);
  const [preferredDays, setPreferredDays] = useState([]);
  const [preferredTimeSlots, setPreferredTimeSlots] = useState([]);
  const [philosophy, setPhilosophy] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const [applicationProofName, setApplicationProofName] = useState('');
  const [applicationProofUrl, setApplicationProofUrl] = useState('');
  const uid = user?.uid;

  const loadApplication = useCallback(async () => {
    if (!uid) {
      setLoadError(new Error('Sign in again to load your tutor profile.'));
      setLoadStatus('error');
      return;
    }

    setLoadStatus('loading');
    setLoadError(null);
    try {
      const application = await getTutorApplication(uid);
      setApplicationStatus(application?.verificationStatus ?? 'not_submitted');
      const savedTutorType = isStudentApplicant
        ? TUTOR_TYPES.PEER
        : user?.tutorType
          ?? application?.tutorType
          ?? (user?.role === ROLES.PROFESSIONAL ? TUTOR_TYPES.PROFESSIONAL : null)
          ?? (application?.tier
            ? application.tier === TUTOR_TIERS.PEER
              ? TUTOR_TYPES.PEER
              : TUTOR_TYPES.PROFESSIONAL
            : null);
      setNeedsTutorTypeChoice(!isStudentApplicant && !savedTutorType);
      setTutorType(savedTutorType ?? TUTOR_TYPES.PEER);
      setTier(
        isStudentApplicant
          ? TUTOR_TIERS.PEER
          : application?.tier
            ?? (savedTutorType === TUTOR_TYPES.PROFESSIONAL
              ? TUTOR_TIERS.ALUMNI
              : TUTOR_TIERS.PEER),
      );
      const savedCredentials = application?.credentials;
      setCredentials(
        Array.isArray(savedCredentials)
          ? (savedCredentials.length ? savedCredentials : [''])
          : typeof savedCredentials === 'string' && savedCredentials.trim()
            ? savedCredentials.split('\n')
            : [''],
      );
      setPreferredDays(application?.preferredDays ?? []);
      setPreferredTimeSlots(application?.preferredTimeSlots ?? []);
      setCourses(
        (application?.courses ?? []).map((course) => ({
          ...course,
          id: course.id || createCourseId(),
          proofName: course.proofName ?? '',
          proofUrl: course.proofUrl ?? '',
        })),
      );
      setSelectedFormats(application?.formats ?? []);
      setPhilosophy(application?.teachingPhilosophy ?? '');
      setApplicationProofName(application?.applicationProofName ?? '');
      setApplicationProofUrl(application?.applicationProofUrl ?? '');
      setLoadStatus('ready');
    } catch (error) {
      setLoadError(error);
      setLoadStatus('error');
    }
  }, [uid, isStudentApplicant, user?.role, user?.tutorType]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const tutor = {
    name: user?.name || 'Tutor',
    subject: courses[0] ? `${courses[0].code}: ${courses[0].title}` : 'Add your first course',
  };
  const statusLabel = ({
    not_submitted: 'Not submitted',
    pending: 'Awaiting review',
    approved: 'Approved',
    rejected: 'Changes requested',
  })[applicationStatus] ?? 'Not submitted';

  function toggleFormat(format) {
    setSelectedFormats((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format],
    );
  }

  function toggleSelection(value, setter) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function updateCredential(index, value) {
    setCredentials((current) => current.map((credential, credentialIndex) => (
      credentialIndex === index ? value : credential
    )));
  }

  function addCredential() {
    setCredentials((current) => [...current, '']);
  }

  function removeCredential(index) {
    setCredentials((current) => {
      const next = current.filter((_, credentialIndex) => credentialIndex !== index);
      return next.length ? next : [''];
    });
  }

  async function submitApplication() {
    const applicationTutorType = isStudentApplicant ? TUTOR_TYPES.PEER : tutorType;
    const applicationTier = isStudentApplicant ? TUTOR_TIERS.PEER : tier;
    if (
      courses.length === 0 ||
      credentials.some((credential) => !credential.trim()) ||
      preferredDays.length === 0 ||
      preferredTimeSlots.length === 0 ||
      selectedFormats.length === 0 ||
      !isCertified
    ) {
      Alert.alert('A few details are missing', 'Complete your credentials, courses, availability, and certification before submitting.');
      return;
    }
    const evidenceError = getTutorApplicationEvidenceError({
      tutorType: applicationTutorType,
      tier: applicationTier,
      courses,
      applicationProofName,
      applicationProofUrl,
    }, user?.role);
    if (evidenceError) {
      Alert.alert('Proof details needed', evidenceError);
      return;
    }

    setSaving(true);
    try {
      await saveTutorApplication(uid, {
        name: user?.name ?? '',
        tutorType: applicationTutorType,
        tier: applicationTier,
        credentials: credentials.map((credential) => credential.trim()).join('\n'),
        preferredDays,
        preferredTimeSlots,
        courses,
        teachingPhilosophy: philosophy.trim(),
        formats: selectedFormats,
        applicationProofName: applicationProofName.trim(),
        applicationProofUrl: applicationProofUrl.trim(),
      });
      Alert.alert('Application submitted', 'We’ll review your application soon.');
      await loadApplication();
    } catch (error) {
      Alert.alert('Couldn’t submit your application', getErrorMessage(error, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (loadStatus === 'loading') return <LoadingState message="Loading your tutor profile..." />;
  if (loadStatus === 'error') {
    return (
      <ErrorState
        title="Tutor profile isn’t available"
        message={getErrorMessage(loadError)}
        onRetry={loadApplication}
      />
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <MentorHeader
            tutor={tutor}
            statusLabel={statusLabel}
            imageUri={user?.photoUrl}
            approved={applicationStatus === 'approved'}
          />
          <View style={styles.pageIntro}>
            <Text style={styles.pageTitle}>Tutor application</Text>
            <Text style={styles.pageSubtitle}>Tell students what you teach and when you’re available.</Text>
          </View>
          <EligibilityCard tutorType={tutorType} />

          <Section>
            <SectionTitle
              title="Tutor category"
              subtitle={isStudentApplicant
                ? 'Student applications are for Peer Tutors.'
                : needsTutorTypeChoice
                  ? 'Choose the option that matches your experience.'
                  : 'Selected when you signed up.'}
            />
            {needsTutorTypeChoice ? (
              <View style={styles.selectionGrid}>
                {[
                  [TUTOR_TYPES.PEER, TUTOR_TIERS.PEER],
                  [TUTOR_TYPES.PROFESSIONAL, 'Alumni / Professor'],
                ].map(([type, label]) => {
                  const selected = tutorType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => {
                        setTutorType(type);
                        setTier(type === TUTOR_TYPES.PEER ? TUTOR_TIERS.PEER : TUTOR_TIERS.ALUMNI);
                        setNeedsTutorTypeChoice(false);
                      }}
                      style={[styles.selectionChip, selected && styles.selectionChipActive]}
                    >
                      <Text style={[styles.selectionChipText, selected && styles.selectionChipTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : tutorType === TUTOR_TYPES.PEER ? (
              <View style={styles.selectionGrid}>
                <Pressable style={[styles.selectionChip, styles.selectionChipActive]}>
                  <Text style={[styles.selectionChipText, styles.selectionChipTextActive]}>
                    {TUTOR_TIERS.PEER}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.selectionGrid}>
                {[TUTOR_TIERS.ALUMNI, TUTOR_TIERS.PROFESSOR].map((option) => {
                const selected = tier === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setTier(option)}
                    style={[styles.selectionChip, selected && styles.selectionChipActive]}
                  >
                    <Text style={[styles.selectionChipText, selected && styles.selectionChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
                })}
              </View>
            )}
          </Section>

          <Section>
            <SectionTitle title="Credentials" subtitle="Show students your subject expertise." />
            {credentials.map((credential, index) => (
              <View key={`credential-${index}`} style={styles.credentialEntry}>
                <View style={styles.credentialLabelRow}>
                  <FieldLabel required>Credential {index + 1}</FieldLabel>
                  {credentials.length > 1 ? (
                    <Pressable onPress={() => removeCredential(index)} hitSlop={10} accessibilityLabel={`Remove credential ${index + 1}`}>
                      <Ionicons name="trash-outline" size={16} color={colors.mutedText} />
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  value={credential}
                  onChangeText={(value) => updateCredential(index, value)}
                  placeholder="e.g., Summa Cum Laude"
                  placeholderTextColor={colors.placeholder}
                  style={styles.credentialsInput}
                />
              </View>
            ))}
            <Pressable style={styles.addCredentialButton} onPress={addCredential}>
              <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
              <Text style={styles.addCredentialText}>Add another credential</Text>
            </Pressable>
            <View style={styles.credentialHintRow}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.secondary} />
              <Text style={styles.credentialHint}>We’ll review your credentials with your Google Drive proof links.</Text>
            </View>
          </Section>

          <Section>
            <SectionTitle
              title="Courses you want to tutor"
              subtitle={tutorType === TUTOR_TYPES.PEER
                ? 'Each course needs a grade from 1.00 to 1.50 and its own Drive proof.'
                : 'List each course. Grades are optional for alumni and professors.'}
              action={<View style={styles.auditBadge}><Ionicons name="document-text-outline" size={14} color={colors.primary} /><Text style={styles.auditText}>Proof{`\n`}review</Text></View>}
            />
            {tutorType === TUTOR_TYPES.PROFESSIONAL ? (
              <View style={styles.courseForm}>
                <FieldLabel required>Describe your professional proof</FieldLabel>
                <TextInput
                  value={applicationProofName}
                  onChangeText={setApplicationProofName}
                  placeholder="e.g., Faculty ID and employment certificate"
                  placeholderTextColor={colors.placeholder}
                  style={styles.textInput}
                />
                <FieldLabel required>Application Google Drive link</FieldLabel>
                <TextInput
                  value={applicationProofUrl}
                  onChangeText={setApplicationProofUrl}
                  placeholder="https://drive.google.com/file/d/..."
                  placeholderTextColor={colors.placeholder}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.textInput}
                />
                <Text style={styles.fieldLabel}>
                  One Drive link should contain the proof covering your application and listed courses.
                </Text>
              </View>
            ) : null}
            <CourseForm
              tutorType={tutorType}
              onAdd={(course) => setCourses((current) => [...current, course])}
            />
            <Text style={styles.listTitle}>Courses Added to Application</Text>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                tutorType={tutorType}
                onRemove={() => setCourses((current) => current.filter((item) => item.id !== course.id))}
              />
            ))}
            <View style={styles.courseSummary}>
              <Text style={styles.summaryLabel}>Subject{`\n`}Summary</Text>
              <Text style={styles.summaryValue}>
                {courses.length} Courses Listed{`\n`}
                ({courses.length ? 'Proof required' : 'None yet'})
              </Text>
            </View>
          </Section>

          <Section>
            <SectionTitle title="Session format" subtitle="Choose how students can meet with you." />
            {[
              { value: 'Online Synchronous', label: 'Online Synchronous', description: 'Meet in an online video room with a shared whiteboard.', icon: 'videocam-outline' },
              { value: 'On-Campus Study Rooms', label: 'On-Campus Study Rooms', description: 'Meet in a reserved campus study room.', icon: 'location-outline' },
              { value: 'Off-Campus / Partner Hubs', label: 'Off-Campus', description: 'Meet at an off-campus location.', icon: 'cafe-outline' },
            ].map(({ value, label, description, icon }) => {
              const selected = selectedFormats.includes(value);
              return (
                <Pressable key={value} style={styles.formatRow} onPress={() => toggleFormat(value)}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                  </View>
                  <View style={styles.formatCopy}>
                    <Text style={styles.formatTitle}>{label}</Text>
                    <Text style={styles.formatDescription}>{description}</Text>
                  </View>
                  <Ionicons name={icon} size={16} color={selected ? colors.secondary : colors.mutedText} />
                </Pressable>
              );
            })}
          </Section>

          <Section>
            <SectionTitle
              title="Session Pricing"
              subtitle="Set the session token amount in your Tutor Workspace after your application is approved."
            />
          </Section>

          <Section>
            <SectionTitle title="Availability" subtitle="Choose when students can book you." />
            <FieldLabel required>Preferred days</FieldLabel>
            <View style={styles.selectionGrid}>
              {tutoringDays.map((day) => {
                const selected = preferredDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleSelection(day, setPreferredDays)}
                    style={[styles.selectionChip, selected && styles.selectionChipActive]}
                  >
                    <Text style={[styles.selectionChipText, selected && styles.selectionChipTextActive]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FieldLabel required>Preferred time windows</FieldLabel>
            <View style={styles.timeSlotList}>
              {tutoringTimeSlots.map((slot) => {
                const selected = preferredTimeSlots.includes(slot);
                return (
                  <Pressable
                    key={slot}
                    onPress={() => toggleSelection(slot, setPreferredTimeSlots)}
                    style={[styles.timeSlot, selected && styles.timeSlotActive]}
                  >
                    <Ionicons name={selected ? 'checkmark-circle' : 'time-outline'} size={16} color={selected ? colors.success : colors.mutedText} />
                    <Text style={[styles.timeSlotText, selected && styles.timeSlotTextActive]}>{slot}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.availabilitySummary}>
              <Ionicons name="calendar-outline" size={16} color={colors.success} />
              <Text style={styles.availabilitySummaryText}>
                {preferredDays.length} day{preferredDays.length === 1 ? '' : 's'} and {preferredTimeSlots.length} time window{preferredTimeSlots.length === 1 ? '' : 's'} selected
              </Text>
            </View>
          </Section>

          <Section>
            <SectionTitle title="Teaching approach" subtitle="Describe how you help students understand a topic." />
            <FieldLabel>Teaching statement (optional)</FieldLabel>
            <TextInput
              value={philosophy}
              onChangeText={setPhilosophy}
              multiline
              textAlignVertical="top"
              style={styles.philosophyInput}
            />
          </Section>

          <Pressable style={styles.certificationRow} onPress={() => setIsCertified((current) => !current)}>
            <View style={[styles.checkbox, isCertified && styles.checkboxSelected]}>
              {isCertified ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
            <Text style={styles.certificationText}>I confirm my academic records are accurate and may be checked. I’ll mentor with integrity.</Text>
          </Pressable>

          <View style={styles.submitPanel}>
            {applicationStatus === 'approved' ? (
              <Text style={styles.approvedNotice}>
                Your application is approved. Contact support if your tutor details need to change.
              </Text>
            ) : (
              <AppButton title="Submit application" onPress={submitApplication} loading={saving} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
