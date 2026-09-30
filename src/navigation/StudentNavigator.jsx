import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AppHeaderActions, AppHeaderBrand } from '../components/AppHeader';
import ChatScreen from '../screens/ChatScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { TutorsScreen } from '../screens/TutorsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import TutorProfileScreen from '../screens/TutorProfileScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabConfig = {
  Tutors: { icon: 'people', inactiveIcon: 'people-outline' },
  Profile: { icon: 'person', inactiveIcon: 'person-outline' },
  Schedule: { icon: 'calendar', inactiveIcon: 'calendar-outline' },
  TutorProfile: { icon: 'school', inactiveIcon: 'school-outline' },
  Chat: { icon: 'chatbubble', inactiveIcon: 'chatbubble-outline' },
};

const headerTitles = {
  Tutors: 'Tutors',
  Profile: 'Profile',
  Schedule: 'Schedule',
  TutorProfile: 'Tutor Profile',
  Chat: 'Messages',
};

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Tutors"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitle: () => <AppHeaderBrand title={headerTitles[route.name]} />,
        headerRight: () => <AppHeaderActions />,
        headerStyle: {
          backgroundColor: colors.background,
          height: 68,
        },
        headerShadowVisible: false,
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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tutors" options={{ title: 'Tutors' }}>
        {() => <TutorsScreen />}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => <StudentProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Schedule" options={{ title: 'Schedule' }}>
        {() => <ScheduleScreen />}
      </Tab.Screen>

      <Tab.Screen name="TutorProfile" options={{ title: 'Tutor Profile' }}>
        {() => <TutorProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Chat" options={{ title: 'Chat' }}>
        {() => <ChatScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}