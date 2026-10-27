export const colors = {
  // Main brand colors
  primary: '#241A73',       // deep indigo/purple buttons and active tabs
  primaryDark: '#191252',
  secondary: '#00A39A',     // teal accents and online indicators

  // Screen colors
  background: '#F5F7F9',    // main app background
  surface: '#FFFFFF',       // cards, header, search field
  inputBackground: '#F1F3F6',

  // Text
  text: '#24232D',
  heading: '#17152F',
  mutedText: '#777985',
  placeholder: '#9A9BA5',
  inverseText: '#FFFFFF',

  // Borders and separators
  border: '#E5E7EB',
  divider: '#EEF0F2',

  // Status colors
  success: '#008F86',
  online: '#00A39A',
  avatarBackground: '#C8CBD0',
  error: '#D9534F',
  warning: '#E5A928',

  // Text colors that stay readable on the soft status backgrounds below
  successText: '#006F66',
  warningText: '#6E3900',
  errorText: '#BA1A1A',
  errorBackground: '#FFDAD6',

  // Figma-style soft category colors
  lavender: '#DED9FF',      // Alumni tag
  mint: '#C8F0E9',          // Peer Tutor tag
  peach: '#FFE1D4',         // Faculty tag
  paleYellow: '#FFF1C7',    // schedule/status highlights
  paleBlue: '#DCEBFF',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
};

const roleColors = {
  alumni: colors.lavender,
  peerTutor: colors.mint,
  faculty: colors.peach,
};