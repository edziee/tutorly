// Screens for a logged-in admin. Only reachable when the user's role is
// 'admin' (see AppNavigator). Member 3 builds the layout, Member 4 connects the
// data.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../constants/routes';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminReviewHistoryScreen from '../screens/admin/AdminReviewHistoryScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabIcons = {
  [ROUTES.ADMIN_VERIFICATIONS]: 'shield-checkmark-outline',
  [ROUTES.ADMIN_REVIEW_HISTORY]: 'time-outline',
};

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.ADMIN_VERIFICATIONS}
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name={ROUTES.ADMIN_VERIFICATIONS}
        component={AdminVerificationsScreen}
        options={{ title: 'Awaiting review' }}
      />
      <Tab.Screen
        name={ROUTES.ADMIN_REVIEW_HISTORY}
        component={AdminReviewHistoryScreen}
        options={{ title: 'Review history' }}
      />
    </Tab.Navigator>
  );
}
