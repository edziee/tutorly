// Screens shown to someone who is not logged in.
// Owner: Member 3 (layout) with Member 1 (login logic).
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LOGIN}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} />
      {/* Hidden admin login. It is registered so it can be opened with
          navigation.navigate(ROUTES.ADMIN_LOGIN), but no normal screen links to
          it. Member 3 and Member 1 agree on how the team gets there. */}
      <Stack.Screen name={ROUTES.ADMIN_LOGIN} component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}
