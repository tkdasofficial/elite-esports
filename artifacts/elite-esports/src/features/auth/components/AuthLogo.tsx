import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';

const logoImage = require('../../../../assets/images/logo.png');

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
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
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
      width: 120,
      height: 120,
      borderRadius: 30,
      backgroundColor: '#0D0D0D',
      borderWidth: 1.5,
      borderColor: colors.primary + '66',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoImage: {
      width: 96,
      height: 96,
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
