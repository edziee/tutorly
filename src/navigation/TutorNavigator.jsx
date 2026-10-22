import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import TutorWorkspaceProfileScreen from '../screens/tutor/TutorWorkspaceProfileScreen';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';
import TutorScheduleScreen from '../screens/tutor/TutorScheduleScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ConversationScreen from '../screens/shared/ConversationScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabs = {
  TutorProfile: {
    title: 'Profile',
    icon: 'person',
    inactiveIcon: 'person-outline',
  },
  TutorSchedule: {
    title: 'Schedule',
    icon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  TutorChat: {
    title: 'Chat',
    icon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
  },
};

function TutorTabs() {
  const { user } = useAuth();
  const initials =
    (user?.name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'T';

  return (
    <Tab.Navigator
      initialRouteName="TutorProfile"
      tabBar={(props) => (
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <BottomTabBar {...props} insets={{ ...props.insets, bottom: 0 }} />
        </SafeAreaView>
      )}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: ({ navigation }) => (
          <AppHeader
            title={tabs[route.name].title}
            initials={initials}
            imageUri={user?.photoUrl}
            onNotificationsPress={() =>
              navigation.navigate(ROUTES.NOTIFICATIONS)
            }
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={
              focused
                ? tabs[route.name].icon
                : tabs[route.name].inactiveIcon
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="TutorProfile"
        component={TutorWorkspaceProfileScreen}
      />
      <Tab.Screen name="TutorSchedule" component={TutorScheduleScreen} />
      <Tab.Screen name="TutorChat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

export default function TutorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TutorTabs" component={TutorTabs} />
      <Stack.Screen
        name="TutorApplication"
        component={TutorProfileScreen}
        options={{ headerShown: true, title: 'Tutor Application' }}
      />
      <Stack.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <Stack.Screen
        name={ROUTES.CONVERSATION}
        component={ConversationScreen}
        options={{ headerShown: true, title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}

const styles = {
  safeArea: {
    backgroundColor: colors.surface,
  },
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
};