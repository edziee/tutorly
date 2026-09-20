// App.js
import { NavigationContainer } from '@react-navigation/native';
import StudentNavigator from './src/navigation/StudentNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StudentNavigator />
    </NavigationContainer>
  );
}