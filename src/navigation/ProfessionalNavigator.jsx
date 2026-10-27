// Screens for a logged-in professional tutor (professor or alumni).
// Member 3 builds the dashboard and adds the other screens designed in Figma.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import ConversationScreen from '../screens/shared/ConversationScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfessionalDashboardScreen from '../screens/professional/ProfessionalDashboardScreen';
import AppHeader from '../components/AppHeader';

const Stack = createNativeStackNavigator();

function getInitials(name) {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'PT';
}

function ProfessionalStackHeader({ navigation, title, showBack = true }) {
  const { user } = useAuth();

  return (
    <AppHeader
      title={title}
      {...(showBack ? {
        backAccessibilityLabel: 'Back to previous screen',
        onBackPress: () => navigation.goBack(),
      } : {})}
      initials={getInitials(user?.name)}
      imageUri={user?.photoUrl}
      onNotificationsPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
    />
  );
}

function stackHeader(title, showBack = true) {
  return {
    title,
    header: ({ navigation }) => (
      <ProfessionalStackHeader
        navigation={navigation}
        title={title}
        showBack={showBack}
      />
    ),
  };
}

export default function ProfessionalNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.PROFESSIONAL_DASHBOARD}>
      <Stack.Screen
        name={ROUTES.PROFESSIONAL_DASHBOARD}
        component={ProfessionalDashboardScreen}
        options={stackHeader('Dashboard', false)}
      />
      <Stack.Screen
        name={ROUTES.CHAT}
        component={ChatScreen}
        options={stackHeader('Messages')}
      />
      <Stack.Screen
        name={ROUTES.CONVERSATION}
        component={ConversationScreen}
        options={stackHeader('Conversation')}
      />
      <Stack.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={stackHeader('Notifications')}
      />
    </Stack.Navigator>
  );
}
