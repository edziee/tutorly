// Screens for a logged-in tutor. For now only the tutor profile and application
// screen that already exists. Member 3 adds the rest of the tutor screens from
// Figma (for example the tutor's sessions and messages) here.
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import TutorWorkspaceProfileScreen from '../screens/tutor/TutorWorkspaceProfileScreen';
import TutorScheduleScreen from '../screens/tutor/TutorScheduleScreen';
import TutorChatScreen from '../screens/tutor/TutorChatScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabs = {
  TutorProfile: { title: 'Profile', icon: 'person', inactiveIcon: 'person-outline' },
  TutorSchedule: { title: 'Schedule', icon: 'calendar', inactiveIcon: 'calendar-outline' },
  TutorChat: { title: 'Chat', icon: 'chatbubble', inactiveIcon: 'chatbubble-outline' },
};

function TutorTabs() {
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
        title: tabs[route.name].title,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? tabs[route.name].icon : tabs[route.name].inactiveIcon}
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
      <Tab.Screen name="TutorChat" component={TutorChatScreen} />
    </Tab.Navigator>
  );
}

export default function TutorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TutorTabs" component={TutorTabs} />
    </Stack.Navigator>
  );
}

const styles = {
  safeArea: { backgroundColor: colors.surface },
  tabBar: { height: 70, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
  tabLabel: { fontSize: 10, fontWeight: '600' },
};
