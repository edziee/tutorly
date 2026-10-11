import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import AppHeader from '../components/AppHeader';
import StudentAvatar from '../components/StudentAvatar';
import { TutorsScreen } from '../screens/student/TutorsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ScheduleScreen from '../screens/student/ScheduleScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';
import { mockStudentProfile } from '../data/mockStudentProfile';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabConfig = {
  Tutors: { icon: 'people', inactiveIcon: 'people-outline', title: 'Tutors' },
  Profile: { icon: 'person', inactiveIcon: 'person-outline', title: 'Profile' },
  Schedule: { icon: 'calendar', inactiveIcon: 'calendar-outline', title: 'Schedule' },
  TutorProfile: { icon: 'school', inactiveIcon: 'school-outline', title: 'Tutor Profile' },
  Chat: { icon: 'chatbubble', inactiveIcon: 'chatbubble-outline', title: 'Messages' },
};

const studentInitials = mockStudentProfile.name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2);

export default function StudentNavigator() {
  const [profileImageUri, setProfileImageUri] = useState(null);

  return (
    <Tab.Navigator
      initialRouteName="Tutors"
      tabBar={(props) => (
        <SafeAreaView edges={['bottom']} style={styles.tabBarSafeArea}>
          <BottomTabBar
            {...props}
            insets={{ ...props.insets, bottom: 0 }}
          />
        </SafeAreaView>
      )}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: ({ navigation }) => (
          <AppHeader
            title={tabConfig[route.name].title}
            initials={studentInitials}
            imageUri={profileImageUri}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const config = tabConfig[route.name];
          const iconName = focused ? config.icon : config.inactiveIcon;

          if (route.name === 'Profile') {
            return (
              <StudentAvatar
                imageUri={profileImageUri}
                initials={studentInitials}
                size={size}
              />
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tutors" options={{ title: 'Tutors' }}>
        {() => <TutorsScreen />}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => (
          <StudentProfileScreen
            profileImageUri={profileImageUri}
            onProfileImageChange={setProfileImageUri}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Schedule" options={{ title: 'Schedule' }}>
        {() => <ScheduleScreen />}
      </Tab.Screen>

      <Tab.Screen name="TutorProfile" options={{ title: 'Tutor Profile' }}>
        {() => <TutorProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

const styles = {
  tabBarSafeArea: {
    backgroundColor: colors.surface,
  },
};