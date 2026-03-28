import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Animated, TextInput, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useNotifications } from '@/store/NotificationsContext';
import { WEB_TOP_INSET } from '@/utils/webInsets';

interface Props {
  onSearch?: (query: string) => void;
}

export function GlobalHeader({ onSearch }: Props) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const openSearch = () => {
    setSearching(true);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 120,
      friction: 10,
    }).start(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setQuery('');
    onSearch?.('');
    Animated.spring(anim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 120,
      friction: 10,
    }).start(() => setSearching(false));
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  // Interpolated values for the animation
  const logoOpacity = anim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  const searchWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const searchOpacity = anim.interpolate({ inputRange: [0.3, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>

        {/* Left — logo (fades out when searching) */}
        <Animated.View style={[styles.left, { opacity: logoOpacity }]} pointerEvents={searching ? 'none' : 'auto'}>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={17} color={Colors.primary} />
          </View>
          <Text style={styles.logoText}>
            Elite <Text style={styles.logoHighlight}>eSports</Text>
          </Text>
        </Animated.View>

        {/* Animated search bar (expands over the full row) */}
        {searching && (
          <Animated.View style={[styles.searchBar, { width: searchWidth, opacity: searchOpacity }]}>
            <Ionicons name="search-outline" size={18} color={Colors.text.muted} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={handleChange}
              placeholder="Search by game, prize pool…"
              placeholderTextColor={Colors.text.muted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleChange('')} activeOpacity={0.7} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Right — icons */}
        <View style={styles.right}>
          {searching ? (
            <TouchableOpacity style={styles.iconBtn} onPress={closeSearch} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={openSearch} activeOpacity={0.7}>
                <Ionicons name="search-outline" size={21} color={Colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={21} color={Colors.text.secondary} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
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
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A0500',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '99',
  },
  logoText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  logoHighlight: { color: Colors.primary },

  searchBar: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    height: 40,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    height: '100%',
  },
  clearBtn: {
    padding: 2,
    marginLeft: 4,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    paddingHorizontal: 4,
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 5,
    backgroundColor: Colors.primary,
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold' },
});
