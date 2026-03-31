import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_TOP_INSET } from '@/utils/webInsets';

interface ScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, rightElement, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack ?? (() => router.back())} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>
          {rightElement ?? <View style={{ width: 48 }} />}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.background.dark,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    content: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    backBtn: {
      width: 48, height: 48,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 24,
    },
    title: {
      flex: 1, fontSize: 17,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      marginLeft: 4, letterSpacing: -0.3,
    },
    right: {
      width: 48, height: 48,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
