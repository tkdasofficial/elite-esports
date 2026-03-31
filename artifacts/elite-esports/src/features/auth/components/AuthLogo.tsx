import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';

interface Props {
  tagline?: string;
  showName?: boolean;
}

export function AuthLogo({ tagline = 'Compete. Win. Dominate.', showName = true }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, !showName && styles.containerCompact]}>
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="flash" size={36} color={colors.primary} />
        </View>
      </View>
      {showName && (
        <Text style={styles.appName}>
          Elite <Text style={styles.highlight}>eSports</Text>
        </Text>
      )}
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: 36,
    },
    containerCompact: {
      marginBottom: 20,
    },
    logoWrap: {
      marginBottom: 18,
    },
    logoCircle: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5,
      borderColor: colors.primary + '66',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appName: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    highlight: {
      color: colors.primary,
    },
    tagline: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
      letterSpacing: 0.4,
    },
  });
}
