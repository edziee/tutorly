import { View, FlatList, StyleSheet, Text, TextInput, Pressable, Button, TouchableHighlight, ScrollView, TouchableOpacity } from "react-native";
import { mockTutors } from "../data/mockTutors"
import { useEffect, useState } from "react";
import TutorCard from "../components/TutorCard"
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { courseCategories } from "../data/courseCategories";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


export const TutorsScreen = () => { //place tutors prop later

    const [textInput, setTextInput] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    const categories = {
        computerScience: {
            keyword: "CS",
        },
    }

    const handlePress = () => {
        console.log("");
    }

    const handleChangeText = (changedText) => {
        setTextInput(changedText);
    }

    const handleCategoryPress = (item) => {
        setSearchCategory(item.keyword);
    }

    const appInputConfig = {
        placeholder: "Search Subjects, Course Codes, or Tutors",
    }

    const styles = StyleSheet.create({
        container: {
            borderWidth: 15,
            borderColor: 'rgba(158, 150, 150, 0)'
        },

        appInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            flexDirection: 'row',
            marginBottom: spacing.md,
            alignItems: 'center',
            width: '100%',
            backgroundColor: colors.white,
        },

        searchIcon: {
            padding: 10,
        },

        categories: {
            flexDirection: 'row',
            marginBottom: spacing.md,
        },

        categoryList: {
            margin: '0 10 10 0',
        },

        categoryButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: spacing.sm,
            marginRight: 2,
            backgroundColor: colors.secondary,
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
            backgroundColor: colors.white,
            flex: 1,
        },

        tutorListContainer: {
            borderRadius: 20,
            backgroundColor: colors.placeholder,
            padding: 10,
        },
    });

    const sanitizeString = string => string.trim().toLowerCase();

    //Implement search functionality later
    //Change CSS styling later
    //NOTE: Implement selectedId for FlatList
    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.headerContainer}>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <Text style={styles.header}>Tutors</Text>

                    <FontAwesome5 style={{ marginRight: 7, }} name="map-marked-alt" size={27} color={colors.primary} />

                </View>


                <View style={styles.appInput}>
                    <Feather style={styles.searchIcon} name="search" size={20} color="black" />
                    <TextInput
                        onChangeText={handleChangeText}
                        placeholder={appInputConfig.placeholder}
                        secureTextEntry={false}
                        style={styles.input}
                    />
                </View>

            </SafeAreaView>
            <SafeAreaView edges={[]}>
                <View style={styles.categories}>
                    <FlatList data={courseCategories}
                        renderItem={({ item }) =>
                            <Pressable underlayColor={colors.primary}
                                uppercase={false}
                                onPress={() => handleCategoryPress(item)}
                                color={colors.white}
                                style={({ pressed }) => [
                                    styles.categoryButton,
                                    {
                                        backgroundColor: pressed ? colors.primary : colors.secondary,
                                    },
                                ]}>
                                <Text>{item.label}</Text>
                            </Pressable>}
                        keyExtractor={item => item.id}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false} />
                </View>

                <FlatList
                    style={styles.tutorListContainer}
                    data={mockTutors.filter(tutor =>
                        (sanitizeString(tutor.name).includes(sanitizeString(textInput)) ||
                            sanitizeString(tutor.subject).includes(sanitizeString(textInput))) &&
                        sanitizeString(tutor.subject).includes(sanitizeString(searchCategory)))}
                    renderItem={({ item }) =>
                        <TutorCard tutor={item} handlePress={handlePress} />}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>

    );
}