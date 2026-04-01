import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { useNotifications } from '@/store/NotificationsContext';
import type { AppColors } from '@/utils/colors';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  match:   'game-controller-outline',
  wallet:  'wallet-outline',
  general: 'notifications-outline',
};

const TYPE_LABEL: Record<string, string> = {
  match:   'Match',
  wallet:  'Wallet',
  general: 'General',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications } = useNotifications();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const notif = notifications.find(n => n.id === id);

  const iconName = ICON_MAP[notif?.type ?? ''] ?? 'notifications-outline';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 40 }} />
      </View>

      {notif ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon + Type badge */}
          <View style={styles.iconRow}>
            <View style={[styles.iconCircle, { backgroundColor: notif.is_read ? colors.background.elevated : 'rgba(254,76,17,0.14)' }]}>
              <Ionicons
                name={iconName}
                size={28}
                color={notif.is_read ? colors.text.muted : colors.primary}
              />
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.background.elevated }]}>
              <Text style={[styles.typeLabel, { color: notif.is_read ? colors.text.muted : colors.primary }]}>
                {TYPE_LABEL[notif.type] ?? 'Notification'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{notif.title}</Text>

          {/* Timestamp */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={colors.text.muted} />
            <Text style={styles.time}>{formatDate(notif.created_at)}</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

          {/* Full message body */}
          <Text style={styles.body}>{notif.message}</Text>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.text.muted} />
          <Text style={styles.notFoundText}>Notification not found</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={[styles.notFoundLink, { color: colors.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.dark,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: colors.background.elevated,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
    },
    content: {
      padding: 20,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    typeLabel: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      lineHeight: 30,
      marginBottom: 10,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 22,
    },
    time: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
    },
    divider: {
      height: 1,
      marginBottom: 22,
    },
    body: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.text.secondary,
      lineHeight: 24,
    },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    notFoundText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: colors.text.muted,
    },
    notFoundLink: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
  });
}
