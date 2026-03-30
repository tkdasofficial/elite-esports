import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_TOP_INSET } from '@/utils/webInsets';

interface ScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, rightElement }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>
          {rightElement ?? <View style={{ width: 48 }} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background.dark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginLeft: 4,
    letterSpacing: -0.3,
  },
  right: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
