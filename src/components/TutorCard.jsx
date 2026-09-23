import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function TutorCard({ tutor, handlePress }) {
  return (
    <Pressable style={({ pressed }) => [
      styles.card,
      {
        opacity: pressed ? 0.75 : 1,
      }
    ]}
      onPress={handlePress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{tutor.name}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{tutor.name}</Text>
        <Text style={styles.subject}>{tutor.subject}</Text>
        <Text style={styles.rating}>
          <AntDesign name="star" size={13} color="gold" />
          <Text style={{color: 'gold'}}> {tutor.rating} stars</Text> ({tutor.reviewCount} reviews)
        </Text>
        <Text style={styles.rate}>₱{tutor.hourlyRate}/hour</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subject: {
    color: colors.mutedText,
    marginTop: 4,
  },
  rating: {
    color: colors.text,
    marginTop: 4,
  },
  rate: {
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});