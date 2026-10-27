import { colors } from './colors';
import { typography } from './typography';

export const tabBarStyle = {
  height: 68,
  paddingTop: 6,
  paddingBottom: 6,
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
};

export const tabBarLabelStyle = {
  ...typography.tab,
  marginTop: 1,
  flexShrink: 0,
};
