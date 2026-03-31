import React, {
  createContext, useContext, useState, useMemo, useEffect, ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, AppColors, darkColors } from '@/utils/colors';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  themeMode: ThemeMode;
  theme: 'dark' | 'light';
  isDark: boolean;
  colors: AppColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemeModeState(val as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('theme', mode);
  };

  const resolvedTheme: 'dark' | 'light' =
    themeMode === 'system'
      ? (systemScheme === 'light' ? 'light' : 'dark')
      : themeMode;

  const isDark = resolvedTheme === 'dark';
  const colors = getColors(isDark);

  const value = useMemo(
    () => ({ themeMode, theme: resolvedTheme, isDark, colors, setThemeMode }),
    [themeMode, resolvedTheme, isDark, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useColors(): AppColors {
  return useTheme().colors;
}
