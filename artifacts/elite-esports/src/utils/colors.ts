export const darkColors = {
  primary: '#EE3D2D',
  primaryDark: '#C02E20',
  primaryLight: '#FF5A4A',
  black: '#000000',
  white: '#FFFFFF',
  background: {
    dark: '#080808',
    card: '#121212',
    elevated: '#1C1C1C',
    surface: '#202020',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    muted: '#555555',
    inverse: '#000000',
  },
  border: {
    default: '#1E1E1E',
    subtle: '#141414',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    upcoming: '#3B82F6',
    ongoing: '#22C55E',
    completed: '#555555',
    cancelled: '#EF4444',
  },
  tab: {
    active: '#EE3D2D',
    inactive: '#444444',
  },
};

export const lightColors = {
  primary: '#EE3D2D',
  primaryDark: '#C02E20',
  primaryLight: '#FF5A4A',
  black: '#000000',
  white: '#FFFFFF',
  background: {
    dark: '#F5F5F5',
    card: '#FFFFFF',
    elevated: '#EEEEEE',
    surface: '#E8E8E8',
  },
  text: {
    primary: '#0A0A0A',
    secondary: '#555555',
    muted: '#9A9A9A',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#E0E0E0',
    subtle: '#EBEBEB',
  },
  status: {
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    upcoming: '#2563EB',
    ongoing: '#16A34A',
    completed: '#9A9A9A',
    cancelled: '#DC2626',
  },
  tab: {
    active: '#EE3D2D',
    inactive: '#AAAAAA',
  },
};

export type AppColors = typeof darkColors;

export function getColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export const Colors = darkColors;
export default Colors;
