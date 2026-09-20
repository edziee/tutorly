import { View, FlatList } from "react-native";
import { mockTutors } from "../data/mockTutors"
import { useState } from "react";
import TutorCard from "../components/TutorCard"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export const TutorsScreen = () => { //place tutors prop later

    const [textInput, setTextInput] = useState("");

    const handlePress = () => {
        console.log("");
    }

    return (
        <View>
            <FlatList
                data={mockTutors}
                renderItem={({ item }) =>
                    <TutorCard tutor={item} handlePress={handlePress} />} 
                keyExtractor={item => item.id}
                    />
        </View>

    );
}