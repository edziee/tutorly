import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { mockMentorApplication } from '../data/mockMentorApplication';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

const gradeOptions = ['1.00', '1.25', '1.50'];
const minimumPhilosophyLength = 80;
const tutoringDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const tutoringTimeSlots = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'];

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

function MentorHeader({ tutor }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTopLine}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tutor.name.charAt(0)}</Text>
        </View>
        <View style={styles.heroIdentity}>
          <Text style={styles.eyebrow}>Tutor Profile</Text>
          <Text style={styles.heroName}>{tutor.name}</Text>
          <Text style={styles.heroSubject}>{tutor.subject}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Ready to apply</Text>
        </View>
      </View>
      <View style={styles.heroRule} />
      <Text style={styles.heroCopy}>
        Complete your mentor profile to help students find the right academic support.
      </Text>
    </View>
  );
}

function EligibilityCard() {
  return (
    <View style={styles.eligibilityCard}>
      <View style={styles.eligibilityIcon}>
        <Ionicons name="ribbon-outline" size={18} color={colors.error} />
      </View>
      <View style={styles.eligibilityCopy}>
        <Text style={styles.eligibilityTitle}>Academic Eligibility Rule</Text>
        <Text style={styles.eligibilityBody}>
          Applicants must hold a final grade of 1.50 or better in the course they wish to mentor.
        </Text>
        <View style={styles.thresholdBox}>
          <View style={styles.thresholdHeader}>
            <Text style={styles.thresholdLabel}>Collegiate Grade Threshold</Text>
            <Text style={styles.thresholdValue}>1.50 Max Cutoff</Text>
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

function CourseRow({ course, onRemove }) {
  return (
    <View style={styles.courseRow}>
      <View style={styles.courseIcon}>
        <Ionicons name="school-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.courseDetails}>
        <Text style={styles.courseCode}>{course.code}</Text>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.proofText}>
          <Ionicons name="document-attach-outline" size={12} color={colors.secondary} />{' '}
          TOR Proof attached ({course.proof})
        </Text>
      </View>
      <View style={styles.courseStatus}>
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${course.code}`}>
          <Ionicons name="trash-outline" size={16} color={colors.mutedText} />
        </Pressable>
        <Text style={styles.courseReady}>Ready to{`\n`}Tutor</Text>
      </View>
    </View>
  );
}

function CourseForm({ onAdd }) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [proof, setProof] = useState(null);

  async function pickProof() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      setProof(result.assets[0]);
    }
  }

  function addCourse() {
    if (!code.trim() || !title.trim() || !grade || !proof) {
      Alert.alert('Incomplete course', 'Add the course details and upload its transcript proof first.');
      return;
    }
    onAdd({
      id: `course-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      grade,
      proof: proof.name,
    });
    setCode('');
    setTitle('');
    setGrade('');
    setProof(null);
  }

  return (
    <View style={styles.courseForm}>
      <View style={styles.addCourseHeading}>
        <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
        <Text style={styles.addCourseText}>Add Subject for Review</Text>
        <Text style={styles.gradeScaleText}>Collegiate Scale: 1.00 - 1.50 Cutoff</Text>
      </View>
      <FieldLabel required>Course Code or Subject Title</FieldLabel>
      <View style={styles.inputWithIcon}>
        <Ionicons name="book-outline" size={17} color={colors.mutedText} />
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="e.g., CS 201 - Data Structures, or MATH 110"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
        />
      </View>
      <FieldLabel required>Final Collegiate Grade</FieldLabel>
      <View style={styles.inputWithIcon}>
        <Ionicons name="star-outline" size={17} color={colors.mutedText} />
        <TextInput
          value={grade}
          onChangeText={setGrade}
          placeholder="e.g., 1.25 (1.00 - 1.50 Max)"
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>
      <Text style={styles.fieldLabel}>Quick grade selection</Text>
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
      <FieldLabel required>Course Title</FieldLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Discrete Mathematics"
        placeholderTextColor={colors.placeholder}
        style={styles.textInput}
      />
      <Pressable style={styles.uploadBox} onPress={pickProof}>
        <Ionicons name="cloud-upload-outline" size={24} color={colors.secondary} />
        <Text style={styles.uploadTitle}>
          {proof ? `Selected: ${proof.name}` : 'Tap to upload SIS portal screenshot'}
        </Text>
        <Text style={styles.uploadHint}>{proof ? 'Tap to replace file' : 'PNG, JPG, or PDF (Max 10MB)'}</Text>
      </Pressable>
      <Pressable style={styles.addButton} onPress={addCourse}>
        <Ionicons name="add" size={18} color={colors.white} />
        <Text style={styles.addButtonText}>Add Course to Mentorship List</Text>
      </Pressable>
    </View>
  );
}

export default function TutorProfileScreen() {
  const {
    tutor,
    credentials: initialCredentials,
    preferredDays: initialPreferredDays,
    preferredTimeSlots: initialPreferredTimeSlots,
    courses: initialCourses,
    teachingPhilosophy,
  } = mockMentorApplication;
  const [courses, setCourses] = useState(initialCourses);
  const [selectedFormats, setSelectedFormats] = useState(['Online Synchronous']);
  const [credentials, setCredentials] = useState([initialCredentials]);
  const [preferredDays, setPreferredDays] = useState(initialPreferredDays);
  const [preferredTimeSlots, setPreferredTimeSlots] = useState(initialPreferredTimeSlots);
  const [philosophy, setPhilosophy] = useState(teachingPhilosophy);
  const [isCertified, setIsCertified] = useState(false);

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

  function submitApplication() {
    if (
      courses.length === 0 ||
      credentials.some((credential) => !credential.trim()) ||
      preferredDays.length === 0 ||
      preferredTimeSlots.length === 0 ||
      philosophy.trim().length < minimumPhilosophyLength ||
      !isCertified
    ) {
      Alert.alert('Application incomplete', 'Complete your credentials, availability, teaching statement, and record confirmation.');
      return;
    }
    Alert.alert('Application ready', 'Your mentor application has been submitted for review.');
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
          <MentorHeader tutor={tutor} />
          <View style={styles.pageIntro}>
            <Text style={styles.pageTitle}>Become a Verified Peer Mentor</Text>
            <Text style={styles.pageSubtitle}>Share your strengths, support your peers, and earn certified campus recognition.</Text>
          </View>
          <EligibilityCard />

          <Section>
            <SectionTitle title="Credentials & Academic Background" subtitle="Give students confidence in your subject expertise" />
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
                  placeholder="e.g., Summa Cum Laude Alumni"
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
              <Text style={styles.credentialHint}>Credentials are reviewed alongside your uploaded academic records.</Text>
            </View>
          </Section>

          <Section>
            <SectionTitle
              title="Courses You Wish to Tutor"
              subtitle="Select subjects where you earned 1.00 - 1.50 collegiate honor standing"
              action={<View style={styles.auditBadge}><Ionicons name="document-text-outline" size={14} color={colors.primary} /><Text style={styles.auditText}>Manual{`\n`}Entry & Audit</Text></View>}
            />
            <CourseForm onAdd={(course) => setCourses((current) => [...current, course])} />
            <Text style={styles.listTitle}>Courses Added to Application</Text>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                onRemove={() => setCourses((current) => current.filter((item) => item.id !== course.id))}
              />
            ))}
            <View style={styles.courseSummary}>
              <Text style={styles.summaryLabel}>Subject{`\n`}Summary</Text>
              <Text style={styles.summaryValue}>{courses.length} Courses Added{`\n`}({courses.length ? 'Eligible' : 'None yet'})</Text>
            </View>
          </Section>

          <Section>
            <SectionTitle title="Mentoring Format & Modality" subtitle="Tell peers how you are equipped to facilitate" />
            {[
              ['Online Synchronous', 'Integrated in-app video room with auto-generated whiteboard canvas.', 'videocam-outline'],
              ['On-Campus Study Rooms', 'Designated reservation slots at university quiet collaboration pods.', 'location-outline'],
              ['Off-Campus / Partner Hubs', 'Partner study lounges and verified coffee spaces near campus perimeter.', 'cafe-outline'],
            ].map(([format, description, icon]) => {
              const selected = selectedFormats.includes(format);
              return (
                <Pressable key={format} style={styles.formatRow} onPress={() => toggleFormat(format)}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                  </View>
                  <View style={styles.formatCopy}>
                    <Text style={styles.formatTitle}>{format}</Text>
                    <Text style={styles.formatDescription}>{description}</Text>
                  </View>
                  <Ionicons name={icon} size={16} color={selected ? colors.secondary : colors.mutedText} />
                </Pressable>
              );
            })}
          </Section>

          <Section>
            <SectionTitle title="Standard Campus Stipend" action={<Text style={styles.fixedBadge}>Fixed Base</Text>} />
            <View style={styles.ratePanel}>
              <Text style={styles.rateLabel}>Core Session Rate</Text>
              <View style={styles.rateRow}>
                <Text style={styles.rateValue}>₱250.00</Text>
                <View style={styles.overtimeBadge}><Text style={styles.overtimeText}>+ ₱50.00 / hr{`\n`}Authorized overtime</Text></View>
              </View>
              <Text style={styles.rateDescription}>Covers standard session blocks up to 3 full hours</Text>
            </View>
            <View style={styles.bankNote}><Ionicons name="cash-outline" size={16} color={colors.secondary} /><Text style={styles.bankText}>Disbursed bi-weekly straight to your connected bank account.</Text></View>
          </Section>

          <Section>
            <SectionTitle title="Preferred Tutoring Availability" subtitle="Choose the days and time windows when students can book you" />
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
            <SectionTitle title="Pedagogy & Approach" subtitle="Tell peers how you simplify complex collegiate material" />
            <FieldLabel required>Teaching Philosophy Statement</FieldLabel>
            <TextInput
              value={philosophy}
              onChangeText={setPhilosophy}
              multiline
              textAlignVertical="top"
              style={styles.philosophyInput}
            />
            <View style={styles.characterRow}>
              <Text style={styles.characterHint}>Minimum 80 characters for honor certification</Text>
              <Text style={[styles.characterCount, philosophy.trim().length < minimumPhilosophyLength && styles.characterCountWarning]}>{philosophy.trim().length} characters</Text>
            </View>
          </Section>

          <Pressable style={styles.certificationRow} onPress={() => setIsCertified((current) => !current)}>
            <View style={[styles.checkbox, isCertified && styles.checkboxSelected]}>
              {isCertified ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
            <Text style={styles.certificationText}>I certify that my uploaded and synced academic records are authentic and authorized for peer verification. I commit to mentoring with integrity.</Text>
          </Pressable>

          <View style={styles.submitPanel}>
            <AppButton title="Submit Mentor Application" onPress={submitApplication} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  content: { paddingBottom: spacing.xxl, gap: spacing.md },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg },
  heroTopLine: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontSize: 21, fontWeight: '800' },
  heroIdentity: { flex: 1 },
  eyebrow: { color: colors.lavender, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroName: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 2 },
  heroSubject: { color: colors.lavender, fontSize: 12, marginTop: 2 },
  statusBadge: { alignItems: 'flex-end' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint, marginBottom: 4 },
  statusText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  heroRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: spacing.md },
  heroCopy: { color: colors.lavender, fontSize: 13, lineHeight: 19 },
  pageIntro: { paddingHorizontal: spacing.xs },
  pageTitle: { color: colors.heading, fontSize: 22, fontWeight: '800' },
  pageSubtitle: { color: colors.mutedText, fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  sectionTitleCopy: { flex: 1, paddingRight: spacing.sm },
  sectionTitle: { color: colors.heading, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 2 },
  auditBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  auditText: { color: colors.primary, fontSize: 10, fontWeight: '800', marginLeft: 4 },
  eligibilityCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row' },
  eligibilityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  eligibilityCopy: { flex: 1 },
  eligibilityTitle: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  eligibilityBody: { color: colors.text, fontSize: 12, lineHeight: 17, marginTop: 3 },
  thresholdBox: { backgroundColor: colors.inputBackground, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.md },
  thresholdHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  thresholdLabel: { color: colors.text, fontSize: 11, fontWeight: '700' },
  thresholdValue: { color: colors.success, fontSize: 11, fontWeight: '800' },
  thresholdBar: { height: 11, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  thresholdSegment: { flex: 1 },
  thresholdLow: { backgroundColor: colors.primary },
  thresholdMid: { backgroundColor: colors.success },
  thresholdHigh: { backgroundColor: '#63D2C5' },
  thresholdDisabled: { backgroundColor: '#DDE1E5' },
  thresholdScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  scaleText: { color: colors.primary, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  scaleActive: { color: colors.success },
  scaleDisabled: { color: colors.placeholder },
  courseForm: { backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  addCourseHeading: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  addCourseText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginLeft: 5, flex: 1 },
  gradeScaleText: { color: colors.mutedText, fontSize: 10, fontWeight: '700', maxWidth: 130 },
  fieldLabel: { color: colors.text, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  required: { color: colors.error },
  inputWithIcon: { backgroundColor: colors.white, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  input: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 11, paddingHorizontal: spacing.sm },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, color: colors.text, fontSize: 13, padding: spacing.sm, marginBottom: spacing.md },
  gradeOptions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  gradeOption: { backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  gradeOptionActive: { backgroundColor: colors.mint, borderColor: colors.secondary },
  gradeOptionText: { color: colors.mutedText, fontSize: 12, fontWeight: '700' },
  gradeOptionTextActive: { color: colors.success },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#B7B9C8', backgroundColor: colors.white, borderRadius: radius.sm, alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  uploadTitle: { color: colors.text, fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
  uploadHint: { color: colors.mutedText, fontSize: 11, marginTop: spacing.xs },
  addButton: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  addButtonText: { color: colors.white, fontSize: 12, fontWeight: '800', marginLeft: 4 },
  listTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  courseRow: { backgroundColor: colors.inputBackground, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', marginBottom: spacing.sm },
  courseIcon: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  courseDetails: { flex: 1 },
  courseCode: { color: colors.text, fontSize: 14, fontWeight: '800' },
  courseTitle: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  proofText: { color: colors.success, fontSize: 10, marginTop: spacing.sm },
  courseStatus: { alignItems: 'flex-end', justifyContent: 'space-between' },
  courseReady: { color: colors.primary, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  courseSummary: { backgroundColor: colors.mint, borderRadius: radius.sm, padding: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: colors.success, fontSize: 11, fontWeight: '700' },
  summaryValue: { backgroundColor: colors.success, color: colors.white, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  formatRow: { backgroundColor: colors.inputBackground, borderRadius: radius.sm, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  checkbox: { width: 19, height: 19, borderRadius: 3, borderWidth: 1, borderColor: colors.mutedText, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  formatCopy: { flex: 1, paddingRight: spacing.sm },
  formatTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  formatDescription: { color: colors.mutedText, fontSize: 11, lineHeight: 16, marginTop: 2 },
  fixedBadge: { color: colors.success, backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  ratePanel: { backgroundColor: colors.inputBackground, borderRadius: radius.sm, padding: spacing.md },
  rateLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rateValue: { color: colors.primary, fontSize: 34, fontWeight: '900' },
  overtimeBadge: { backgroundColor: '#E0E2E6', borderRadius: radius.sm, padding: spacing.sm },
  overtimeText: { color: colors.primary, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  rateDescription: { color: colors.mutedText, fontSize: 11, lineHeight: 16, maxWidth: 190 },
  bankNote: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  bankText: { color: colors.mutedText, fontSize: 11, marginLeft: spacing.sm, flex: 1 },
  credentialEntry: { marginBottom: spacing.sm },
  credentialLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  credentialsInput: { minHeight: 84, backgroundColor: colors.inputBackground, borderRadius: radius.sm, color: colors.text, fontSize: 13, lineHeight: 18, padding: spacing.md },
  addCredentialButton: { alignItems: 'center', borderColor: colors.primary, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', padding: spacing.sm, marginTop: spacing.xs },
  addCredentialText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginLeft: spacing.xs },
  credentialHintRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  credentialHint: { color: colors.mutedText, flex: 1, fontSize: 10, lineHeight: 15, marginLeft: spacing.xs },
  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  selectionChip: { backgroundColor: colors.inputBackground, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selectionChipActive: { backgroundColor: colors.mint, borderColor: colors.secondary },
  selectionChipText: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  selectionChipTextActive: { color: colors.success },
  timeSlotList: { gap: spacing.sm },
  timeSlot: { alignItems: 'center', backgroundColor: colors.inputBackground, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', padding: spacing.sm },
  timeSlotActive: { backgroundColor: colors.mint, borderColor: colors.secondary },
  timeSlotText: { color: colors.mutedText, fontSize: 12, fontWeight: '600', marginLeft: spacing.sm },
  timeSlotTextActive: { color: colors.success },
  availabilitySummary: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.md, padding: spacing.sm },
  availabilitySummaryText: { color: colors.success, fontSize: 11, fontWeight: '700', marginLeft: spacing.sm },
  philosophyInput: { minHeight: 130, backgroundColor: colors.inputBackground, borderRadius: radius.sm, color: colors.text, fontSize: 14, lineHeight: 20, padding: spacing.md },
  characterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  characterHint: { color: colors.mutedText, fontSize: 10, fontWeight: '700', maxWidth: '65%' },
  characterCount: { color: colors.success, fontSize: 11, fontWeight: '800' },
  characterCountWarning: { color: colors.error },
  certificationRow: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start' },
  certificationText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 17 },
  submitPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm },
});
