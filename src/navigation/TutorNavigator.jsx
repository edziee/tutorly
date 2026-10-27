import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import ScreenContainer from '../components/ScreenContainer';
import WorkspaceSwitchCard from '../components/WorkspaceSwitchCard';
import TutorWorkspaceProfileScreen from '../screens/tutor/TutorWorkspaceProfileScreen';
import TutorApplicationScreen from '../screens/tutor/TutorProfileScreen';
import TutorScheduleScreen from '../screens/tutor/TutorScheduleScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ConversationScreen from '../screens/shared/ConversationScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import WalletScreen from '../screens/shared/WalletScreen';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { getTutorApplication } from '../services/tutorService';
import { colors } from '../theme/colors';
import { tabBarLabelStyle, tabBarStyle } from '../theme/navigation';
import { getErrorMessage } from '../utils/errors';
import { canUseTutorOperations, hasDirectTutorAccountStatus } from '../utils/workspace';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabs = {
  TutorProfile: {
    title: 'Profile',
    icon: 'person',
    inactiveIcon: 'person-outline',
  },
  TutorSchedule: {
    title: 'Schedule',
    icon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  TutorChat: {
    title: 'Messages',
    icon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
  },
};

function getInitials(name) {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'T';
}

function TutorStackHeader({
  navigation,
  title,
  showBack = true,
  notificationsEnabled = true,
}) {
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
      userId={user?.uid}
      role={user?.role}
      onWalletPress={() => navigation.navigate(ROUTES.WALLET)}
      onNotificationsPress={
        notificationsEnabled
          ? () => navigation.navigate(ROUTES.NOTIFICATIONS)
          : undefined
      }
    />
  );
}

function stackHeader(title, notificationsEnabled = true) {
  return {
    headerShown: true,
    header: ({ navigation }) => (
      <TutorStackHeader
        navigation={navigation}
        title={title}
        notificationsEnabled={notificationsEnabled}
      />
    ),
  };
}

function TutorTabs() {
  const { user } = useAuth();
  const initials =
    (user?.name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'T';

  return (
    <Tab.Navigator
      initialRouteName="TutorProfile"
      tabBar={(props) => (
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <BottomTabBar {...props} insets={{ ...props.insets, bottom: 0 }} />
        </SafeAreaView>
      )}
      screenOptions={({ route }) => ({
        headerShown: true,
        header: ({ navigation }) => (
          <AppHeader
            title={tabs[route.name].title}
            initials={initials}
            imageUri={user?.photoUrl}
            userId={user?.uid}
            role={user?.role}
            onWalletPress={() => navigation.navigate(ROUTES.WALLET)}
            onNotificationsPress={() =>
              navigation.navigate(ROUTES.NOTIFICATIONS)
            }
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarLabelPosition: 'below-icon',
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={
              focused
                ? tabs[route.name].icon
                : tabs[route.name].inactiveIcon
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="TutorProfile"
        component={TutorWorkspaceProfileScreen}
        options={{ tabBarLabel: 'Tutor Profile' }}
      />
      <Tab.Screen
        name="TutorSchedule"
        component={TutorScheduleScreen}
        options={{ tabBarLabel: 'Tutor Schedule' }}
      />
      <Tab.Screen
        name="TutorChat"
        component={ChatScreen}
        options={{ tabBarLabel: 'Tutor Chat' }}
      />
    </Tab.Navigator>
  );
}

export default function TutorNavigator() {
  const { user, setWorkspaceMode } = useAuth();
  const isDirectTutorAccount = hasDirectTutorAccountStatus(
    user?.role,
    user?.tutorVerificationStatus,
  );
  const [applicationStatus, setApplicationStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const uid = user?.uid;

  const loadApplicationStatus = useCallback(async () => {
    if (!uid) {
      setLoadError(new Error('Sign in again to open the tutor workspace.'));
      setApplicationStatus('error');
      return;
    }
    setApplicationStatus('loading');
    setLoadError(null);
    try {
      const application = await getTutorApplication(uid);
      setApplicationStatus(application?.verificationStatus ?? 'not_submitted');
    } catch (error) {
      setLoadError(error);
      setApplicationStatus('error');
    }
  }, [isDirectTutorAccount, uid]);

  const returnToStudentProfile = async () => {
    try {
      await setWorkspaceMode('student');
    } catch (error) {
      Alert.alert('Could not save workspace preference', getErrorMessage(error, 'Please try again.'));
    }
  };

  useEffect(() => {
    loadApplicationStatus();
  }, [loadApplicationStatus]);

  if (applicationStatus === 'loading') {
    return (
      <ScreenContainer>
        <LoadingState message="Loading your tutor workspace..." />
        {user?.role === 'student' ? (
          <WorkspaceSwitchCard
            accessibilityLabel="Switch to student workspace"
            title="Student workspace"
            description="Return to your student profile and learning tools."
            icon="book-outline"
            onPress={returnToStudentProfile}
          />
        ) : null}
      </ScreenContainer>
    );
  }
  if (applicationStatus === 'error') {
    return (
      <ScreenContainer>
        <ErrorState
          title="Tutor workspace isn’t available"
          message={getErrorMessage(loadError, 'Could not load your application status.')}
          onRetry={loadApplicationStatus}
        />
        {user?.role === 'student' ? (
          <WorkspaceSwitchCard
            accessibilityLabel="Switch to student workspace"
            title="Student workspace"
            description="Return to your student profile and learning tools."
            icon="book-outline"
            onPress={returnToStudentProfile}
          />
        ) : null}
      </ScreenContainer>
    );
  }

  const canUseTutorWorkspace = canUseTutorOperations(user?.role, applicationStatus);
  const shouldShowTutorTabs = canUseTutorWorkspace;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {shouldShowTutorTabs ? (
        <Stack.Screen name="TutorTabs" component={TutorTabs} />
      ) : (
        <Stack.Screen
          name="TutorApplicantStatus"
          component={TutorWorkspaceProfileScreen}
          options={{
            headerShown: true,
            header: ({ navigation }) => (
              <TutorStackHeader
                navigation={navigation}
                title="Tutor workspace"
                showBack={false}
                notificationsEnabled={false}
              />
            ),
          }}
        />
      )}
      <Stack.Screen
        name={ROUTES.TUTOR_APPLICATION}
        component={TutorApplicationScreen}
        options={stackHeader('Tutor application', canUseTutorWorkspace)}
      />
      <Stack.Screen
        name={ROUTES.WALLET}
        component={WalletScreen}
        options={stackHeader('Token wallet', canUseTutorWorkspace)}
      />
      {canUseTutorWorkspace ? (
        <>
          <Stack.Screen
            name={ROUTES.NOTIFICATIONS}
            component={NotificationsScreen}
            options={stackHeader('Notifications')}
          />
          <Stack.Screen
            name={ROUTES.CONVERSATION}
            component={ConversationScreen}
            options={stackHeader('Messages')}
          />
        </>
      ) : null}
    </Stack.Navigator>
  );
}

const styles = {
  safeArea: {
    backgroundColor: colors.surface,
  },
};