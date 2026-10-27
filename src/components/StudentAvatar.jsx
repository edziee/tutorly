import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function StudentAvatar({ imageUri, initials, name, size = 40 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const nameInitials = (typeof name === 'string' ? name : '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const fallbackInitials = (
    (typeof initials === 'string' && initials.trim()) || nameInitials
  ).toUpperCase() || '?';

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {imageUri && !imageFailed ? (
        <Image
          source={{ uri: imageUri }}
          resizeMode="cover"
          style={styles.image}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
          {fallbackInitials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
});
