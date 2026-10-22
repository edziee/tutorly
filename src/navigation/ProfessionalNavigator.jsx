// Screens for a logged-in professional tutor (professor or alumni).
// Member 3 builds the dashboard and adds the other screens designed in Figma.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import ConversationScreen from '../screens/shared/ConversationScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfessionalDashboardScreen from '../screens/professional/ProfessionalDashboardScreen';
import AppHeader from '../components/AppHeader';

const Stack = createNativeStackNavigator();

export default function ProfessionalNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.PROFESSIONAL_DASHBOARD}>
      <Stack.Screen
        name={ROUTES.PROFESSIONAL_DASHBOARD}
        component={ProfessionalDashboardScreen}
        options={({ navigation }) => ({
          title: 'Dashboard',
          header: () => <AppHeader title="Dashboard" initials="PT" onNotificationsPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)} />,
        })}
      />
      <Stack.Screen name={ROUTES.CHAT} component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name={ROUTES.CONVERSATION} component={ConversationScreen} options={{ title: 'Conversation' }} />
      <Stack.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
