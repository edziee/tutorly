import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

const tierStyles = {
  Professor: { backgroundColor: colors.primary, color: colors.white, iconColor: colors.white },
  Alumni: { backgroundColor: colors.success, color: colors.white, iconColor: colors.white },
  'Peer Tutor': { backgroundColor: colors.inputBackground, color: colors.text, iconColor: colors.text },
};

export default function TutorCard({ tutor, handlePress }) {
  const tier = tutor.tier || 'Tutor';
  const tierStyle = tierStyles[tier] ?? {
    backgroundColor: colors.inputBackground,
    color: colors.text,
    iconColor: colors.text,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${tutor.name || 'tutor'} and book a session`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
    >
      <View style={styles.topDetails}>
        <View style={styles.avatar}>
          {tutor.photoUrl ? (
            <Image source={{ uri: tutor.photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {tutor.initials ||
                (tutor.name || 'Tutor')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
            </Text>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{tutor.name || 'Tutor'}</Text>
          <View style={[styles.tier, { backgroundColor: tierStyle.backgroundColor }]}>
            {tier === 'Professor' ? (
              <FontAwesome5 name="scroll" size={12} color={tierStyle.iconColor} />
            ) : tier === 'Alumni' ? (
              <FontAwesome5 name="medal" size={12} color={tierStyle.iconColor} />
            ) : tier === 'Peer Tutor' ? (
              <Ionicons name="person" size={12} color={tierStyle.iconColor} />
            ) : null}
            <Text style={[styles.tierText, { color: tierStyle.color }]}>Verified {tier}</Text>
          </View>
          {tutor.credentials ? (
            <Text style={styles.credentials}>{tutor.credentials}</Text>
          ) : null}
          <View style={styles.rating}>
            {Number.isFinite(tutor.rating) ? (
              <>
                <AntDesign name="star" size={14} color={colors.warning} />
                <Text style={styles.ratingValue}>{tutor.rating} stars</Text>
              </>
            ) : (
              <Text style={styles.newTutor}>New tutor</Text>
            )}
            <Text style={styles.reviewCount}>({tutor.reviewCount ?? 0} reviews)</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomDetails}>
        <Text style={styles.price} numberOfLines={2}>
          {Number.isFinite(tutor.hourlyRate) ? `₱${tutor.hourlyRate}` : 'Price not set'}
          <Text style={styles.priceUnit}> / session</Text>
        </Text>
        <View style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book</Text>
          <Ionicons name="calendar-outline" size={18} color={colors.white} />
        </View>
      </View>

      <Text style={styles.subject}>
        Teaches {tutor.subject || 'various subjects'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pressedCard: {
    opacity: 0.92,
  },
  topDetails: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  avatarImage: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.heading,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  tier: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tierText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  credentials: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  rating: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ratingValue: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  newTutor: {
    color: colors.mutedText,
    fontSize: 12,
  },
  reviewCount: {
    color: colors.mutedText,
    fontSize: 11,
  },
  bottomDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  price: {
    color: colors.primary,
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 0,
  },
  priceUnit: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '400',
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  subject: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
