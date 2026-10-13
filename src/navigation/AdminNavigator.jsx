// Screens for a logged-in admin. Only reachable when the user's role is
// 'admin' (see AppNavigator). Member 3 builds the layout, Member 4 connects the
// data.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../constants/routes';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminReviewHistoryScreen from '../screens/admin/AdminReviewHistoryScreen';
import AppHeader from '../components/AppHeader';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabIcons = {
  [ROUTES.ADMIN_DASHBOARD]: 'grid-outline',
  [ROUTES.ADMIN_VERIFICATIONS]: 'shield-checkmark-outline',
  [ROUTES.ADMIN_REVIEW_HISTORY]: 'time-outline',
};

const tabTitles = {
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard',
  [ROUTES.ADMIN_VERIFICATIONS]: 'Awaiting review',
  [ROUTES.ADMIN_REVIEW_HISTORY]: 'Review history',
};

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.ADMIN_DASHBOARD}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppHeader title={tabTitles[route.name]} initials="DA" />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name={ROUTES.ADMIN_DASHBOARD}
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
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
