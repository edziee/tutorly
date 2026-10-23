import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../components/AppHeader';
import StudentAvatar from '../components/StudentAvatar';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import { TutorsScreen } from '../screens/student/TutorsScreen';
import ConversationScreen from '../screens/shared/ConversationScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ScheduleScreen from '../screens/student/ScheduleScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import BookingScreen from '../screens/student/BookingScreen';
import PaymentScreen from '../screens/student/PaymentScreen';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabConfig = {
  Tutors: { icon: 'people', inactiveIcon: 'people-outline', title: 'Tutors' },
  Profile: { icon: 'person', inactiveIcon: 'person-outline', title: 'Profile' },
  Schedule: { icon: 'calendar', inactiveIcon: 'calendar-outline', title: 'Schedule' },
  TutorProfile: { icon: 'school', inactiveIcon: 'school-outline', title: 'Tutor Profile' },
  Chat: { icon: 'chatbubble', inactiveIcon: 'chatbubble-outline', title: 'Messages' },
  [ROUTES.BOOKING]: { icon: 'calendar', inactiveIcon: 'calendar-outline', title: 'Book a session' },
  [ROUTES.PAYMENT]: { icon: 'card', inactiveIcon: 'card-outline', title: 'Payment' },
};

function getInitials(name) {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// The five tabs. They sit inside the stack below so that Notifications and the
// dashboard can open on top of them with a back button.
function StudentTabs() {
  const { user } = useAuth();
  const studentInitials = getInitials(user?.name) || 'S';

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
        headerShown: route.name !== ROUTES.BOOKING && route.name !== ROUTES.PAYMENT,
        header: ({ navigation }) => (
          <AppHeader
            title={tabConfig[route.name].title}
            initials={studentInitials}
            imageUri={user?.photoUrl}
            onProfilePress={() => navigation.navigate('Profile')}
            onNotificationsPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          />
        ),
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
          lineHeight: 14,
          flexShrink: 0,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const config = tabConfig[route.name];
          const iconName = focused ? config.icon : config.inactiveIcon;

          if (route.name === 'Profile') {
            return (
              <StudentAvatar
                imageUri={user?.photoUrl}
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
        {() => <StudentProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Schedule" options={{ title: 'Schedule' }}>
        {() => <ScheduleScreen />}
      </Tab.Screen>

      <Tab.Screen name="TutorProfile" options={{ title: 'Tutor Profile' }}>
        {() => <TutorProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen
        name={ROUTES.BOOKING}
        component={BookingScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name={ROUTES.PAYMENT}
        component={PaymentScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

export default function StudentNavigator() {
  const { user } = useAuth();
  const studentInitials = getInitials(user?.name) || 'S';

  return (
    <Stack.Navigator initialRouteName="StudentTabs">
      <Stack.Screen
        name="StudentTabs"
        component={StudentTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.CONVERSATION} component={ConversationScreen} options={{ title: 'Messages' }} />
      <Stack.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name={ROUTES.STUDENT_DASHBOARD}
        component={StudentDashboardScreen}
        options={{
          title: 'Dashboard',
          header: () => <AppHeader title="Dashboard" initials={studentInitials} />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = {
  tabBarSafeArea: {
    backgroundColor: colors.surface,
  },
};