import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppButton from './AppButton';
import AppHeader from './AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { getAuthErrorMessage } from '../utils/errors';

function getInitials(name, email) {
  const words = (name || email || 'Admin').trim().split(/\s+/);
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : words[0].slice(0, 2).toUpperCase();
}

export default function AdminHeader({ title }) {
  const { user, signOut } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const name = user?.name || 'Administrator';
  const email = user?.email || '';

  const openProfile = () => {
    setSignOutError('');
    setProfileVisible(true);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      setProfileVisible(false);
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <AppHeader
        title={title}
        initials={getInitials(user?.name, user?.email)}
        imageUri={user?.photoUrl}
        onProfilePress={openProfile}
        profileAccessibilityLabel="Open admin profile and sign-out menu"
      />
      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close profile menu"
            onPress={() => setProfileVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.menu}>
            <Text style={styles.heading}>{name}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
            {signOutError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {signOutError}
              </Text>
            ) : null}
            <AppButton
              title="Log out"
              variant="danger"
              onPress={handleSignOut}
              loading={signingOut}
            />
            <Pressable
              accessibilityRole="button"
              disabled={signingOut}
              onPress={() => setProfileVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  heading: {
    color: colors.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.mutedText,
    fontSize: 14,
  },
  error: {
    marginBottom: spacing.md,
    color: colors.errorText,
    fontSize: 13,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
  },
});
