import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';

interface Props {
  tagline?: string;
  showName?: boolean;
}

export function AuthLogo({ tagline = 'Compete. Win. Dominate.', showName = true }: Props) {
  return (
    <View style={[styles.container, !showName && styles.containerCompact]}>
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="flash" size={36} color={Colors.primary} />
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

const styles = StyleSheet.create({
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
    backgroundColor: '#1A0500',
    borderWidth: 1.5,
    borderColor: '#4A1800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  highlight: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    letterSpacing: 0.4,
  },
});
