import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/utils/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'trophy' as const,
    title: 'Enter the Arena',
    body: 'Join elite eSports tournaments and battle the best players. Every match is a chance to prove yourself.',
    gradient: ['#1A0500', '#0A0A0A'] as [string, string],
    accent: '#FE4C11',
  },
  {
    id: '2',
    icon: 'pulse' as const,
    title: 'Track Live Battles',
    body: 'Follow matches in real time. Watch leaderboards shift as the competition heats up — stay in the action.',
    gradient: ['#000D1A', '#0A0A0A'] as [string, string],
    accent: '#3B82F6',
  },
  {
    id: '3',
    icon: 'wallet' as const,
    title: 'Win Real Rewards',
    body: 'Compete for prize pools paid directly to your wallet in Indian Rupees. Every match counts.',
    gradient: ['#0A1A00', '#0A0A0A'] as [string, string],
    accent: '#22C55E',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(i => i + 1);
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      router.replace('/(auth)/options');
    }
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={slide.gradient}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { borderColor: item.accent + '44' }]}>
              <View style={[styles.iconInner, { backgroundColor: item.accent + '18' }]}>
                <Ionicons name={item.icon} size={52} color={item.accent} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && { backgroundColor: slide.accent, width: 24 },
            ]}
          />
        ))}
      </View>

      {/* CTA button */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 24 }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slide.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={activeIndex === SLIDES.length - 1 ? 'arrow-forward-circle' : 'chevron-forward'}
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem('onboarding_seen', 'true');
              router.replace('/(auth)/options');
            }}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Top padding spacer */}
      <View style={{ height: topPad, position: 'absolute', top: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 180,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    gap: 12,
  },
  btn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: '#555555',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
