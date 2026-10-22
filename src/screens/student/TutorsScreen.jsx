import { View, FlatList, StyleSheet, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { useNavigation } from '@react-navigation/native';
import TutorCard from "../../components/TutorCard"
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { courseCategories } from "../../data/courseCategories";
import { Dimensions } from 'react-native';
import { tierCategories } from "../../data/tierCategories";
import Octicons from '@expo/vector-icons/Octicons';
import { useAsync } from '../../hooks/useAsync';
import { getTutors } from '../../services/tutorService';
import { ROUTES } from '../../constants/routes';
import { getErrorMessage } from '../../utils/errors';


export const TutorsScreen = () => { //place tutors prop later

    const navigation = useNavigation();
    const tutorResults = useAsync(() => getTutors(), []);
    const [textInput, setTextInput] = useState("");
    const [courseCategory, setCourseCategory] = useState("");
    const [tierCategory, setTierCategory] = useState("");
    const [courses, setCourses] = useState(courseCategories);
    const [tiers, setTiers] = useState(tierCategories);
    const { width, height } = Dimensions.get('window');

    const categories = {
        computerScience: {
            keyword: "CS",
        },
    }

    const handleChangeText = (changedText) => {
        setTextInput(changedText);
    }

    const handleCoursePress = (item) => {
        const changedCourses = courses.map( course => {
            if (course.id == item.id) {
                return {...course, isSelected: true};
            }
            return {...course, isSelected: false};
        })
        setCourses(changedCourses);
        setCourseCategory(item.keyword);
    }

    const handleTierPress = (item) => {
        const changedTiers = tiers.map(tier => {
            if (tier.id == item.id) {
                return {...tier, isSelected: true};
            }
            return {...tier, isSelected: false};
        })
        setTiers(changedTiers);
        setTierCategory(item.keyword);
    }

    const appInputConfig = {
        placeholder: "Search courses or tutors",
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            borderWidth: 15,
            borderColor: 'rgba(158, 150, 150, 0)',
            backgroundColor: 'white',
        },

        appInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            flexDirection: 'row',
            marginBottom: spacing.md,
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#F2F4F6',
        },

        searchIcon: {
            padding: 10,
        },

        categories: {
            flexDirection: 'row',
            marginBottom: spacing.md,
        },

        categoryList: {
            marginRight: 10,
            marginBottom: 10,
            marginLeft: 0,
            marginTop: 0,
        },

        categoryButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: spacing.sm,
            marginRight: 4,
        },

        headerContainer: {
            display: 'flex',
        },

        header: {
            flex: 1,
            color: colors.text,
            marginBottom: spacing.sm,
            fontWeight: '600',
            fontSize: 30,
        },

        input: {
            borderRadius: 10,
            padding: spacing.md,
            fontSize: 16,
            backgroundColor: "#F2F4F6",
            flex: 1,
        },

        tutorListContainer: {
            borderRadius: 20,
            backgroundColor: "white",
            padding: 10,
            height: height - 200,
        },

        tiers: {
            borderRadius: 12,
            backgroundColor: "#F2F4F6",
            padding: 7,
        },

        tiersContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 15,
            backgroundColor: "#F2F4F6",
            padding: 7,
        }
    });

    const sanitizeString = string => string.trim().toLowerCase();
    const filteredTutors = (tutorResults.data ?? []).filter(tutor =>
        (sanitizeString(tutor.name ?? '').includes(sanitizeString(textInput)) ||
            sanitizeString(tutor.subject ?? '').includes(sanitizeString(textInput))) &&
        sanitizeString(tutor.subject ?? '').includes(sanitizeString(courseCategory)) &&
        sanitizeString(tutor.tier ?? '').includes(sanitizeString(tierCategory)));

    //Implement search functionality later
    //Change CSS styling later
    //NOTE: Implement selectedId for FlatList
    return (
        <SafeAreaView edges={[]} style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.appInput}>
                    <Feather style={styles.searchIcon} name="search" size={20} color="black" />
                    <TextInput
                        onChangeText={handleChangeText}
                        placeholder={appInputConfig.placeholder}
                        secureTextEntry={false}
                        style={styles.input}
                    />
                </View>
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.categories}>
                    <FlatList data={courses}
                        renderItem={({ item }) =>
                            <Pressable underlayColor={colors.primary}
                                uppercase={false}
                                onPress={() => handleCoursePress(item)}
                                color={"black"}
                                style={[styles.categoryButton,
                                    {
                                        backgroundColor: item.isSelected ? "#1A146B" : "#F2F4F6",
                                    }
                                ]}>
                                <Text style={{color: item.isSelected ? "white" : "black"}}>{item.label}</Text>
                            </Pressable>}
                        keyExtractor={item => item.id}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false} />
                </View>

                <View style={styles.tiersContainer}>
                    <Octicons name="stack" size={20} color="black" style={{ marginRight: 7 }} />
                    <Text style={{ color: colors.mutedText, marginRight: 0 }}>TIER:</Text>

                    <View style={styles.tiers}>
                        <View style={{ flexDirection: 'row' }}>
                            <FlatList data={tiers}
                                renderItem={({ item }) =>
                                    <Pressable underlayColor={colors.primary}
                                        uppercase={false}
                                        onPress={() => handleTierPress(item)}
                                        color={"black"}
                                        style={{ marginRight: 10 }}>
                                        <Text style={{color: item.isSelected ? "#1A146B" : "black",
                                                        fontWeight: item.isSelected ? "bold" : "normal",
                                        }}>{item.label}</Text>
                                    </Pressable>}
                                keyExtractor={item => item.id}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false} />
                        </View>
                    </View>
                </View>

                <View>
                    {tutorResults.status === 'loading' ? (
                        <LoadingState compact message="Loading approved tutors..." />
                    ) : tutorResults.status === 'error' ? (
                        <ErrorState
                            compact
                            title="Could not load tutors"
                            message={getErrorMessage(tutorResults.error)}
                            onRetry={tutorResults.retry}
                        />
                    ) : filteredTutors.length ? (
                        <FlatList
                            style={styles.tutorListContainer}
                            data={filteredTutors}
                            renderItem={({ item }) => (
                                <TutorCard
                                    tutor={item}
                                    handlePress={() => navigation.navigate(ROUTES.BOOKING, { tutor: item })}
                                />
                            )}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <EmptyState
                            compact
                            icon="people-outline"
                            title="No tutors found"
                            message="Try another course or check back when more tutors are approved."
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>

    );
}