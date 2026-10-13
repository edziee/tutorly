// Screens for a logged-in admin. Only reachable when the user's role is
// 'admin' (see AppNavigator). Member 3 builds the layout, Member 4 connects the
// data.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ROUTES } from '../constants/routes';
import { colors } from '../theme/colors';
import NotificationBell from '../components/NotificationBell';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';

const Tab = createBottomTabNavigator();

const tabIcons = {
  [ROUTES.ADMIN_DASHBOARD]: 'grid-outline',
  [ROUTES.ADMIN_USERS]: 'people-outline',
  [ROUTES.ADMIN_VERIFICATIONS]: 'shield-checkmark-outline',
  [ROUTES.ADMIN_BOOKINGS]: 'calendar-outline',
};

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.ADMIN_DASHBOARD}
      screenOptions={({ route, navigation }) => ({
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <NotificationBell onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)} />
          </View>
        ),
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
        name={ROUTES.ADMIN_USERS}
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen
        name={ROUTES.ADMIN_VERIFICATIONS}
        component={AdminVerificationsScreen}
        options={{ title: 'Verifications' }}
      />
      <Tab.Screen
        name={ROUTES.ADMIN_BOOKINGS}
        component={AdminBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      {/* Opened from the bell. It has no tab button of its own. */}
      <Tab.Screen
        name={ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
