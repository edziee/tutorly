import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';

import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import TutorCard from '../../components/TutorCard';
import { ROUTES } from '../../constants/routes';
import { courseCategories } from '../../data/courseCategories';
import { tierCategories } from '../../data/tierCategories';
import { useAsync } from '../../hooks/useAsync';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTutors } from '../../services/tutorService';
import { getErrorMessage } from '../../utils/errors';

export const TutorsScreen = () => {
  const navigation = useNavigation();
  const tutorResults = useAsync(() => getTutors(), []);
  const [textInput, setTextInput] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [tierCategory, setTierCategory] = useState('');
  const [courses, setCourses] = useState(courseCategories);
  const [tiers, setTiers] = useState(tierCategories);

  const handleCoursePress = (selectedCourse) => {
    setCourses(courses.map((course) => ({
      ...course,
      isSelected: course.id === selectedCourse.id,
    })));
    setCourseCategory(selectedCourse.keyword);
  };

  const handleTierPress = (selectedTier) => {
    setTiers(tiers.map((tier) => ({
      ...tier,
      isSelected: tier.id === selectedTier.id,
    })));
    setTierCategory(selectedTier.keyword);
  };

  const sanitizeString = (value) => value.trim().toLowerCase();
  const filteredTutors = (tutorResults.data ?? []).filter((tutor) =>
    (sanitizeString(tutor.name ?? '').includes(sanitizeString(textInput)) ||
      sanitizeString(tutor.subject ?? '').includes(sanitizeString(textInput))) &&
    sanitizeString(tutor.subject ?? '').includes(sanitizeString(courseCategory)) &&
    sanitizeString(tutor.tier ?? '').includes(sanitizeString(tierCategory)));

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={colors.mutedText} />
        <TextInput
          accessibilityLabel="Search courses or tutors"
          onChangeText={setTextInput}
          placeholder="Search courses or tutors"
          placeholderTextColor={colors.mutedText}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        data={courses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.isSelected }}
            onPress={() => handleCoursePress(item)}
            style={[
              styles.courseChip,
              item.isSelected && styles.selectedCourseChip,
            ]}
          >
            <Text style={[styles.courseText, item.isSelected && styles.selectedCourseText]}>
              {item.label}
            </Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.courseList}
        style={styles.courseFilter}
      />

      <View style={styles.tierFilter}>
        <View style={styles.tierHeading}>
          <Octicons name="stack" size={16} color={colors.primary} />
          <Text style={styles.tierHeadingText}>Tutor type</Text>
        </View>
        <FlatList
          horizontal
          data={tiers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.isSelected }}
              onPress={() => handleTierPress(item)}
              style={styles.tierChip}
            >
              <Text style={[styles.tierText, item.isSelected && styles.selectedTierText]}>
                {item.label}
              </Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierList}
          style={styles.tierOptions}
        />
      </View>

      <View style={styles.results}>
        {tutorResults.status === 'loading' ? (
          <LoadingState compact message="Loading tutors..." />
        ) : tutorResults.status === 'error' ? (
          <ErrorState
            compact
            title="Tutors aren’t available"
            message={getErrorMessage(tutorResults.error)}
            onRetry={tutorResults.retry}
          />
        ) : filteredTutors.length ? (
          <FlatList
            data={filteredTutors}
            renderItem={({ item }) => (
              <TutorCard
                tutor={item}
                handlePress={() => navigation.navigate(ROUTES.BOOKING, { tutor: item })}
              />
            )}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tutorList}
          />
        ) : (
          <EmptyState
            compact
            icon="people-outline"
            title="No tutors found"
            message="Try another course or check back soon."
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  courseFilter: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  courseList: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  courseChip: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedCourseChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  courseText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedCourseText: {
    color: colors.white,
  },
  tierFilter: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tierHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  tierHeadingText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  tierOptions: {
    flexGrow: 0,
    marginTop: spacing.xs,
  },
  tierList: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  tierChip: {
    flexShrink: 0,
    paddingVertical: spacing.xs,
  },
  tierText: {
    color: colors.text,
    fontSize: 12,
  },
  selectedTierText: {
    color: colors.primary,
    fontWeight: '800',
  },
  results: {
    flex: 1,
    minHeight: 0,
  },
  tutorList: {
    paddingBottom: spacing.lg,
  },
});
