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
        <Ionicons name="flash" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.appName}>Elite eSports</Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 24, backgroundColor: '#1A0500',
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  appName: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.text.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 4 },
});
