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
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start(
      () => inputRef.current?.focus()
    );
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setQuery('');
    onSearch?.('');
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
      () => setSearching(false)
    );
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const logoOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const searchOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>

        <View style={styles.centerFlex}>
          <Animated.View
            style={[styles.logoRow, { opacity: logoOpacity }]}
            pointerEvents={searching ? 'none' : 'auto'}
          >
            <View style={styles.logoMark}>
              <Ionicons name="flash" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.logoText}>
              Elite<Text style={styles.logoAccent}> eSports</Text>
            </Text>
          </Animated.View>

          {searching && (
            <Animated.View style={[StyleSheet.absoluteFill, styles.searchBar, { opacity: searchOpacity }]}>
              <Ionicons name="search-outline" size={17} color={Colors.text.muted} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={handleChange}
                placeholder="Search games, tournaments…"
                placeholderTextColor={Colors.text.muted}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleChange('')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color={Colors.text.muted} />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        <View style={styles.actions}>
          {searching ? (
            <TouchableOpacity onPress={closeSearch} activeOpacity={0.7} style={styles.cancelBtn}>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 6,
    gap: 8,
  },
  centerFlex: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  logoAccent: { color: Colors.primary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    height: '100%',
    paddingVertical: 0,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold' },
});
