import { View, FlatList } from "react-native";
import { mockTutors } from "../data/mockTutors"
import { useState } from "react";
import TutorCard from "../components/TutorCard"
import AppInput from "../components/AppInput"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export const TutorsScreen = () => { //place tutors prop later

    const [textInput, setTextInput] = useState("");

    const handlePress = () => {
        console.log("");
    }

    const handleChangeText = (changedText) => {
        setTextInput(changedText);
    }

    const appInputConfig = {
        label: "Tutors",
        placeholder: "Search Tutors",
        secureTextEntry: false,
    }

    const sanitizeString = string => string.trim().toLowerCase();

    //Implement search functionality later
    //Change CSS styling later
    //NOTE: Implement selectedId for FlatList
    return (
        <View>
            <View>
                <AppInput handleChangeText={handleChangeText} {...appInputConfig} />
            </View>
            <FlatList
                data={mockTutors.filter(tutor => sanitizeString(tutor.name).includes(sanitizeString(textInput)))}
                renderItem={({ item }) =>
                    <TutorCard tutor={item} handlePress={handlePress} />}
                keyExtractor={item => item.id}
            />
        </View>

    );
}