// Screens for a logged-in tutor. For now only the tutor profile and application
// screen that already exists. Member 3 adds the rest of the tutor screens from
// Figma (for example the tutor's sessions and messages) here.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import TutorProfileScreen from '../screens/tutor/TutorProfileScreen';

const Stack = createNativeStackNavigator();

export default function TutorNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.TUTOR_PROFILE}>
      <Stack.Screen
        name={ROUTES.TUTOR_PROFILE}
        component={TutorProfileScreen}
        options={{ title: 'Tutor Profile' }}
      />
    </Stack.Navigator>
  );
}
