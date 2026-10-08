import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const pages = [
  {
    icon: 'people-outline',
    accent: colors.lavender,
    smallIcon: 'sparkles',
    title: 'Find your perfect tutor',
    description:
      'Explore trusted tutors across the subjects you care about and find the right fit for your goals.',
    badge: 'LEARN YOUR WAY',
  },
  {
    icon: 'calendar-outline',
    accent: colors.mint,
    smallIcon: 'chatbubble-ellipses-outline',
    title: 'Make every lesson count',
    description:
      'Book sessions, keep your schedule in one place, and stay connected with your tutor as you grow.',
    badge: 'GROW TOGETHER',
  },
];

export default function OnboardingScreen({ page, onNext, onSkip }) {
  const content = pages[page];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>Tutorly</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          onPress={onSkip}
          hitSlop={12}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.illustration}>
          <View style={[styles.halo, { backgroundColor: content.accent }]} />
          <View style={styles.iconCard}>
            <Ionicons name={content.icon} size={76} color={colors.primary} />
          </View>
          <View style={styles.smallIcon}>
            <Ionicons name={content.smallIcon} size={22} color={colors.white} />
          </View>
          <View style={styles.sparkleOne} />
          <View style={styles.sparkleTwo} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.badge}>{content.badge}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pageIndicator} accessibilityLabel={`Page ${page + 1} of 2`}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[styles.pageDot, index === page && styles.activePageDot]}
            />
          ))}
        </View>
        <AppButton title="Next" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  wordmark: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  illustration: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 244,
    height: 244,
    marginBottom: spacing.xxl,
  },
  halo: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    opacity: 0.58,
  },
  iconCard: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  smallIcon: {
    position: 'absolute',
    right: 26,
    bottom: 31,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.background,
  },
  sparkleOne: {
    position: 'absolute',
    left: 30,
    top: 36,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warning,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 34,
    top: 48,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  badge: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.heading,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    maxWidth: 340,
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  pageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activePageDot: {
    width: 22,
    backgroundColor: colors.primary,
  },
});
