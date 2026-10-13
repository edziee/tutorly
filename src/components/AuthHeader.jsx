import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

// The top of the login and sign-up screens: logo, the "limited to" pill, the
// title and a line of text (see the Figma "SignUp/Login Portal" frames).
export default function AuthHeader({ subtitle, onLogoLongPress }) {
  return (
    <View style={styles.container}>
      <Pressable
        accessible={false}
        delayLongPress={1500}
        onLongPress={onLogoLongPress}
        style={styles.logoTile}
      >
        <Image
          source={require('../../assets/tutorly-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Tutorly logo"
        />
        <View style={styles.onlineDot} />
      </Pressable>

      <View style={styles.pill}>
        <Ionicons name="shield-checkmark" size={13} color={colors.successText} />
        <Text style={styles.pillText}>Limited to Technological Institute of the Philippines</Text>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        Campus Tutoring Hub
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoTile: {
    width: 88,
    height: 88,
    borderRadius: radius.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: 88,
    height: 88,
  },
  onlineDot: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  pillText: {
    flexShrink: 1,
    color: colors.successText,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.65,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
