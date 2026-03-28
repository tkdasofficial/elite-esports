import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_TOP_INSET } from '@/utils/webInsets';

interface AdminHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function AdminHeader({ title, showBack = true, rightElement }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>
          {rightElement ?? <View style={{ width: 40 }} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  content: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  logoBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginLeft: 4 },
  right: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
