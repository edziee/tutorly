// App.js
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StudentNavigator from './src/navigation/StudentNavigator';
import OnboardingScreen from './src/components/OnboardingScreen';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [onboardingPage, setOnboardingPage] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!showSplash) return undefined;

    const timeout = setTimeout(() => {
      setShowSplash(false);
      setOnboardingPage(0);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [showSplash]);

  const finishOnboarding = () => {
    setOnboardingPage(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showSplash ? (
        <SplashScreen />
      ) : onboardingPage !== null ? (
        <OnboardingScreen
          page={onboardingPage}
          onNext={() => {
            if (onboardingPage === 0) {
              setOnboardingPage(1);
            } else {
              finishOnboarding();
            }
          }}
          onSkip={finishOnboarding}
        />
      ) : (
        <NavigationContainer>
          <StudentNavigator />
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}