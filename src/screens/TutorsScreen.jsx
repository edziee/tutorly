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
import { Dimensions } from 'react-native';
import { tierCategories } from "../data/tierCategories";
import Octicons from '@expo/vector-icons/Octicons';


export const TutorsScreen = () => { //place tutors prop later

    const [textInput, setTextInput] = useState("");
    const [courseCategory, setCourseCategory] = useState("");
    const [tierCategory, setTierCategory] = useState("");
    const { width, height } = Dimensions.get('window');

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

    const handleCoursePress = (item) => {
        setCourseCategory(item.keyword);
    }

    const handleTierPress = (item) => {
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
            margin: '0 10 10 0',
        },

        categoryButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: spacing.sm,
            marginRight: 4,
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

    //Implement search functionality later
    //Change CSS styling later
    //NOTE: Implement selectedId for FlatList
    return (
        <SafeAreaView edges={["top"]} style={styles.container}>
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
                    <FlatList data={courseCategories}
                        renderItem={({ item }) =>
                            <Pressable underlayColor={colors.primary}
                                uppercase={false}
                                onPress={() => handleCoursePress(item)}
                                color={"black"}
                                style={({ pressed }) => [
                                    styles.categoryButton,
                                    {
                                        backgroundColor: pressed ? "#1A146B" : "#ECEEF0",
                                        color: pressed ? "white" : "black",
                                    },
                                ]}>
                                <Text>{item.label}</Text>
                            </Pressable>}
                        keyExtractor={item => item.id}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false} />
                </View>

                <View style={styles.tiersContainer}>
                    <Octicons name="stack" size={20} color="black" style={{ marginRight: 7 }} />
                    <Text style={{ color: colors.mutedText, marginRight: 20 }}>TIER:</Text>

                    <View style={styles.tiers}>
                        <View style={{ flexDirection: 'row' }}>
                            <FlatList data={tierCategories}
                                renderItem={({ item }) =>
                                    <Pressable underlayColor={colors.primary}
                                        uppercase={false}
                                        onPress={() => handleTierPress(item)}
                                        color={"black"}
                                        style={{ marginRight: 15 }}>
                                        <Text style={({ pressed }) => [
                                            {
                                                color: pressed ? "white" : "black",
                                                marginRight: 20,
                                            },
                                        ]}>{item.label}</Text>
                                    </Pressable>}
                                keyExtractor={item => item.id}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false} />
                        </View>
                    </View>
                </View>

                <View>
                    <FlatList
                        style={styles.tutorListContainer}
                        data={mockTutors.filter(tutor =>
                            (sanitizeString(tutor.name).includes(sanitizeString(textInput)) ||
                                sanitizeString(tutor.subject).includes(sanitizeString(textInput))) &&
                            sanitizeString(tutor.subject).includes(sanitizeString(courseCategory)) &&
                            sanitizeString(tutor.tier).includes(sanitizeString(tierCategory)))}
                        renderItem={({ item }) =>
                            <TutorCard tutor={item} handlePress={handlePress} />}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </SafeAreaView>

    );
}