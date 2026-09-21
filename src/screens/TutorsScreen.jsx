import { View, FlatList, StyleSheet, Text, TextInput } from "react-native";
import { mockTutors } from "../data/mockTutors"
import { useState } from "react";
import TutorCard from "../components/TutorCard"
import AppInput from "../components/AppInput"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'


export const TutorsScreen = () => { //place tutors prop later

    const [textInput, setTextInput] = useState("");

    const categories = {
        computerScience: {
            keyword: "CS",
        }
    }

    const handlePress = () => {
        console.log("");
    }

    const handleChangeText = (changedText) => {
        setTextInput(changedText);
    }

    const appInputConfig = {
        placeholder: "Search Subjects, Course Codes, or Tutors",
    }

    const styles = StyleSheet.create({
        container: {
            display: 'flex',
            margin: 15,
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

        },

        header: {
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
    });

    const sanitizeString = string => string.trim().toLowerCase();

    //Implement search functionality later
    //Change CSS styling later
    //NOTE: Implement selectedId for FlatList
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Tutors</Text>

            <View style={styles.appInput}>
                <Feather style={styles.searchIcon} name="search" size={20} color="black" />
                <TextInput
                    onChangeText={handleChangeText}
                    placeholder={appInputConfig.placeholder}
                    secureTextEntry={false}
                    style={styles.input}
                />
            </View>

            <View style={styles.categories}>

            </View>

            <FlatList
                data={mockTutors.filter(tutor =>
                    sanitizeString(tutor.name).includes(sanitizeString(textInput)) ||
                    sanitizeString(tutor.subject).includes(sanitizeString(textInput)))}
                renderItem={({ item }) =>
                    <TutorCard tutor={item} handlePress={handlePress} />}
                keyExtractor={item => item.id}
            />
        </SafeAreaView>

    );
}