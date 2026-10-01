import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TutorCard({ tutor, handlePress }) {
  const styles = StyleSheet.create({
    card: {
      flexDirection: 'column',
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: "gray",
    },

    topDetails: {
      flexDirection: 'row',
      marginBottom: 15,
    },

    bottomDetails: {
      flexDirection: 'row',
      marginBottom: 15,
    },

    tier: {
      backgroundColor: tutor.tier == "Professor" ? "#312E81" :
        tutor.tier == "Alumni" ? "#006A61" :
          tutor.tier == "Peer Tutor" ? "#E6E8EA" : "white",
      borderRadius: 12,
      padding: 7,
      flexDirection: "row",
      width: "55%",
      alignItems: 'center',
    },

    tierText: {
      color: tutor.tier == "Professor" ? "white" :
        tutor.tier == "Alumni" ? "white" :
          tutor.tier == "Peer Tutor" ? "black" : "white",
      fontWeight: "bold",
      fontSize: 12,
      marginLeft: 5,
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
      fontSize: 19,
      fontWeight: 'bold',
      marginBottom: 3,
    },
    mutedText: {
      color: colors.mutedText,
      marginTop: 4,
      fontSize: 16,
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
    hourlyRate: {
      fontWeight: 'bold',
      fontSize: 20,
      color: "#1A146B",
    },

    overTime: {
      backgroundColor: "#E6E8EA",
      borderRadius: 12,
      padding: 5,
    },

    bookButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: "blue",
      paddingVertical: 7,
      paddingHorizontal: 15,

      borderRadius: 12,
      alignSelf: 'end',
      marginLeft: 'auto',
    }
  });

  return (
    <Pressable style={styles.card}
      onPress={handlePress}>
      <View style={styles.topDetails}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {tutor.initials ||
              tutor.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{tutor.name}</Text>
          <View style={styles.tier}>
            {tutor.tier == "Professor" ? (<FontAwesome5 name="scroll" size={12} color="white" />) :
              tutor.tier == "Alumni" ? (<FontAwesome5 name="medal" size={12} color="white" />) :
                tutor.tier == "Peer Tutor" ? (<Ionicons name="person" size={12} color="black" />) : "white"}
            <Text style={styles.tierText}>Verified {tutor.tier}</Text>
          </View>
          <Text style={styles.mutedText}>{tutor.credentials}</Text>
          <Text style={styles.rating}>
            <AntDesign name="star" size={15} color="gold" />
            <Text style={{ color: 'gold' }}> {tutor.rating} stars</Text> <Text style={{ color: colors.mutedText, fontSize: 12, }}>({tutor.reviewCount} reviews)</Text>
          </Text>
        </View>
      </View>

      <View style={styles.bottomDetails}>
        <View style={{ flex: 'column' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={styles.hourlyRate}>₱{tutor.hourlyRate}</Text><Text> / session</Text>
          </View>
          <View style={styles.overTime}>
            <Text style={{ fontSize: 11, color: "#1A146B" }}>+₱50/hr overtime option</Text>
          </View>
        </View>

        <View style={styles.bookButton}>
          <Text style={{textAlign: 'center', marginRight: 10, color: 'white', fontWeight: 'bold'}}>
            Book{"\n"}
            Session
          </Text>
          <FontAwesome name="calendar-plus-o" size={25} color="white" />
        </View>
      </View>

      <Text style={{color: colors.mutedText, fontSize: 12}}>Teaches {tutor.subject}</Text>
    </Pressable>
  );
}

