import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } =
  Dimensions.get('window');

const BASE_WIDTH = 390;

export const scale = (size) => {
  return Math.round((screenWidth / BASE_WIDTH) * size);
};

export const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

export const isTablet = screenWidth >= 768;

export const screen = {
  width: screenWidth,
  height: screenHeight,
};