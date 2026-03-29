import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_TOP_INSET } from '@/utils/webInsets';
import { useAdminSidebar } from '@/store/AdminSidebarContext';

interface AdminHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function AdminHeader({ title, rightElement }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;
  const { open } = useAdminSidebar();

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.menuBtn} onPress={open} activeOpacity={0.7}>
          <View style={styles.hamburger}>
            <View style={styles.line} />
            <View style={[styles.line, styles.lineShort]} />
            <View style={styles.line} />
          </View>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>

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
  content: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  menuBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  hamburger: {
    gap: 5,
    alignItems: 'flex-start',
  },
  line: {
    width: 22,
    height: 2,
    backgroundColor: Colors.text.primary,
    borderRadius: 2,
  },
  lineShort: {
    width: 15,
  },
  titleWrap: {
    flex: 1,
    paddingLeft: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    marginTop: 1,
  },
  right: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
