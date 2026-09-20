// src/navigation/StudentNavigator.jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabConfig = {
  Tutors: {
    icon: 'people',
    inactiveIcon: 'people-outline',
  },
  Profile: {
    icon: 'person',
    inactiveIcon: 'person-outline',
  },
  Schedule: {
    icon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  TutorProfile: {
    icon: 'school',
    inactiveIcon: 'school-outline',
  },
  Chat: {
    icon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
  },
};

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Tutors"
      screenOptions={({ route }) => ({
        headerShown: false,
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
      <Tab.Screen
        name="Tutors"
        options={{ title: 'Tutors' }}
      >
        {() => <PlaceholderScreen title="Tutors" />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{ title: 'Profile' }}
      >
        {() => <PlaceholderScreen title="Profile" />}
      </Tab.Screen>

      <Tab.Screen
        name="Schedule"
        options={{ title: 'Schedule' }}
      >
        {() => <PlaceholderScreen title="Schedule" />}
      </Tab.Screen>

      <Tab.Screen
        name="TutorProfile"
        options={{ title: 'Tutor Profile' }}
      >
        {() => <PlaceholderScreen title="Tutor Profile" />}
      </Tab.Screen>

      <Tab.Screen
        name="Chat"
        options={{ title: 'Chat' }}
      >
        {() => <PlaceholderScreen title="Chat" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}