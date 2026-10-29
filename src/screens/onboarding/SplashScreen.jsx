import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function SplashScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 1.12, 440);

  return (
    <View style={styles.container}>
      <View style={styles.topAccent} />
      <View style={styles.bottomAccent} />

      <View style={styles.content}>
        <Image
          source={require('../../../assets/tutorly-logo-transparent.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
          accessibilityLabel="Tutorly logo"
        />
        <Text style={styles.tagline}>Learn more. Grow together.</Text>
        <View style={styles.dots} accessibilityElementsHidden>
          <View style={[styles.dot, styles.goldDot]} />
          <View style={[styles.dot, styles.tealDot]} />
          <View style={[styles.dot, styles.purpleDot]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAccent: {
    position: 'absolute',
    width: 240,
    height: 240,
    top: -155,
    right: -120,
    borderRadius: 120,
    backgroundColor: '#FFF8E8',
  },
  bottomAccent: {
    position: 'absolute',
    width: 270,
    height: 270,
    bottom: -180,
    left: -145,
    borderRadius: 135,
    backgroundColor: '#F5F2FF',
  },
  tagline: {
    marginTop: -12,
    color: '#777985',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  goldDot: {
    backgroundColor: '#F2B532',
  },
  tealDot: {
    backgroundColor: '#00A39A',
  },
  purpleDot: {
    backgroundColor: '#5145A5',
  },
});
