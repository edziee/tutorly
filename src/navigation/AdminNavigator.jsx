// Screens for a logged-in admin. Only reachable when the user's role is
// 'admin' (see AppNavigator). Member 3 builds the layout, Member 4 connects the
// data.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../constants/routes';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminReviewHistoryScreen from '../screens/admin/AdminReviewHistoryScreen';
import AdminWalletsScreen from '../screens/admin/AdminWalletsScreen';
import AdminHeader from '../components/AdminHeader';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcons = {
  [ROUTES.ADMIN_DASHBOARD]: 'grid-outline',
  [ROUTES.ADMIN_VERIFICATIONS]: 'shield-checkmark-outline',
  [ROUTES.ADMIN_REVIEW_HISTORY]: 'time-outline',
  [ROUTES.ADMIN_WALLETS]: 'wallet-outline',
};

const tabTitles = {
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard',
  [ROUTES.ADMIN_VERIFICATIONS]: 'Awaiting review',
  [ROUTES.ADMIN_REVIEW_HISTORY]: 'Review history',
  [ROUTES.ADMIN_WALLETS]: 'Token wallets',
};

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.ADMIN_USERS}
        component={AdminUsersScreen}
        options={{ title: 'Manage users' }}
      />
      <Stack.Screen
        name={ROUTES.ADMIN_BOOKINGS}
        component={AdminBookingsScreen}
        options={{ title: 'View bookings' }}
      />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.ADMIN_DASHBOARD}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AdminHeader title={tabTitles[route.name]} />,
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
      <Tab.Screen
        name={ROUTES.ADMIN_WALLETS}
        component={AdminWalletsScreen}
        options={{ title: 'Token wallets' }}
      />
    </Tab.Navigator>
  );
}
