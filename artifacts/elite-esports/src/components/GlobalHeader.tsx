import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  Animated, TextInput, Keyboard, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useNotifications } from '@/store/NotificationsContext';

const logoImage = require('../../assets/images/logo.png');

interface Props {
  onSearch?: (query: string) => void;
}

export function GlobalHeader({ onSearch }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const topInset = insets.top;

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const openSearch = () => {
    triggerHaptic();
    setSearching(true);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start(
      () => inputRef.current?.focus(),
    );
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setQuery('');
    onSearch?.('');
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(
      () => setSearching(false),
    );
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const logoOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const searchOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.wrap}>
      <View style={styles.blurBorder} />
      <View style={[styles.inner, { paddingTop: topInset }]}>
        <View style={styles.content}>
          <View style={styles.centerFlex}>
            <Animated.View
              style={[styles.logoRow, { opacity: logoOpacity }]}
              pointerEvents={searching ? 'none' : 'auto'}
            >
              <View style={styles.logoMark}>
                <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.logoText}>
                Elite <Text style={styles.logoAccent}>eSports</Text>
              </Text>
            </Animated.View>

            {searching && (
              <Animated.View
                style={[StyleSheet.absoluteFill, styles.searchBar, { opacity: searchOpacity }]}
              >
                <Feather name="search" size={22} color={colors.text.muted} />
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  value={query}
                  onChangeText={handleChange}
                  placeholder="Game, prize pool, status…"
                  placeholderTextColor={colors.text.muted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => handleChange('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x-circle" size={22} color={colors.text.muted} />
                  </Pressable>
                )}
              </Animated.View>
            )}
          </View>

          <View style={styles.right}>
            {searching ? (
              <Pressable onPress={closeSearch} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.iconBtn}
                  onPress={openSearch}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="search" size={26} color={colors.text.secondary} />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => {
                    triggerHaptic();
                    router.push('/notifications');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="bell" size={26} color={colors.text.secondary} />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof import('@/utils/colors').getColors>,
  isDark: boolean,
) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: isDark ? '#080808EE' : '#FFFFFFEE',
      zIndex: 10,
    },
    blurBorder: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 1, backgroundColor: colors.border.subtle,
    },
    inner: {},
    content: {
      height: 64, flexDirection: 'row', alignItems: 'center',
      paddingLeft: 16, paddingRight: 4, gap: 8,
    },
    centerFlex: { flex: 1, height: 52, justifyContent: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoMark: {
      width: 48, height: 48, borderRadius: 13,
      backgroundColor: '#0D0D0D',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.primary + '88',
      overflow: 'hidden',
    },
    logoImage: {
      width: 40,
      height: 40,
    },
    logoText: {
      fontSize: 18, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, letterSpacing: -0.3,
    },
    logoAccent: { color: colors.primary },
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.primary + '44',
      paddingHorizontal: 12, gap: 8,
    },
    searchInput: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.primary, height: '100%', paddingVertical: 0,
    },
    right: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { paddingHorizontal: 14, height: 44, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    badge: {
      position: 'absolute', top: 7, right: 5,
      backgroundColor: colors.primary,
      borderRadius: 7, minWidth: 15, height: 15,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    badgeTxt: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  });
}
