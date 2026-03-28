import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';

interface Props {
  tagline?: string;
}

export function AuthLogo({ tagline = 'Compete. Win. Dominate.' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="flash" size={46} color={Colors.primary} />
      </View>
      <Text style={styles.appName}>Elite <Text style={styles.highlight}>eSports</Text></Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: '#1A0500',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  highlight: { color: Colors.primary },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 5,
    letterSpacing: 0.2,
  },
});
