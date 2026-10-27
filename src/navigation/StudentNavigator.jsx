import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../components/AppHeader';
import StudentAvatar from '../components/StudentAvatar';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import { TutorsScreen } from '../screens/student/TutorsScreen';
import ConversationScreen from '../screens/shared/ConversationScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ScheduleScreen from '../screens/student/ScheduleScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import BookingScreen from '../screens/student/BookingScreen';
import PaymentScreen from '../screens/student/PaymentScreen';
import TutorApplicationScreen from '../screens/tutor/TutorProfileScreen';
import WalletScreen from '../screens/shared/WalletScreen';
import { colors } from '../theme/colors';
import { tabBarLabelStyle, tabBarStyle } from '../theme/navigation';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabConfig = {
  Tutors: { icon: 'people', inactiveIcon: 'people-outline', title: 'Tutors' },
  Profile: { icon: 'person', inactiveIcon: 'person-outline', title: 'Profile' },
  Schedule: { icon: 'calendar', inactiveIcon: 'calendar-outline', title: 'Schedule' },
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

function StudentStackHeader({ navigation, title }) {
  const { user } = useAuth();
  const initials = getInitials(user?.name) || 'S';

  return (
    <AppHeader
      title={title}
      backAccessibilityLabel="Back to previous screen"
      onBackPress={() => navigation.goBack()}
      initials={initials}
      imageUri={user?.photoUrl}
      userId={user?.uid}
      role={user?.role}
      onWalletPress={() => navigation.navigate(ROUTES.WALLET)}
      onProfilePress={() => navigation.navigate('StudentTabs', { screen: 'Profile' })}
      onNotificationsPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
    />
  );
}

function stackHeader(title) {
  return {
    title,
    header: ({ navigation }) => (
      <StudentStackHeader navigation={navigation} title={title} />
    ),
  };
}

// The four student tabs sit inside the stack below so shared screens and the
// tutor application can open on top of them with a back button.
function StudentTabs() {
  const { user, studentProfileOnModeSwitch } = useAuth();
  const studentInitials = getInitials(user?.name) || 'S';

  return (
    <Tab.Navigator
      initialRouteName={studentProfileOnModeSwitch ? ROUTES.PROFILE : ROUTES.TUTORS}
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
            {...(route.name === ROUTES.BOOKING ? {
              backAccessibilityLabel: 'Back to tutors',
              onBackPress: () => navigation.navigate(ROUTES.TUTORS),
            } : route.name === ROUTES.PAYMENT ? {
              backAccessibilityLabel: 'Back to schedule',
              onBackPress: () => navigation.navigate(ROUTES.SCHEDULE),
            } : {})}
            initials={studentInitials}
            imageUri={user?.photoUrl}
            userId={user?.uid}
            role={user?.role}
            onWalletPress={() => navigation.navigate(ROUTES.WALLET)}
            onProfilePress={() => navigation.navigate('Profile')}
            onNotificationsPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          />
        ),
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle,
        tabBarLabelStyle,
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

      <Tab.Screen
        name="Profile"
        component={StudentProfileScreen}
        options={{ title: 'Profile' }}
      />

      <Tab.Screen name="Schedule" options={{ title: 'Schedule' }}>
        {() => <ScheduleScreen />}
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
  return (
    <Stack.Navigator initialRouteName="StudentTabs">
      <Stack.Screen
        name="StudentTabs"
        component={StudentTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CONVERSATION}
        component={ConversationScreen}
        options={stackHeader('Messages')}
      />
      <Stack.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={stackHeader('Notifications')}
      />
      <Stack.Screen
        name={ROUTES.TUTOR_APPLICATION}
        component={TutorApplicationScreen}
        options={stackHeader('Tutor application')}
      />
      <Stack.Screen
        name={ROUTES.WALLET}
        component={WalletScreen}
        options={stackHeader('Token wallet')}
      />
    </Stack.Navigator>
  );
}

const styles = {
  tabBarSafeArea: {
    backgroundColor: colors.surface,
  },
};