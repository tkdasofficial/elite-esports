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

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'trophy' as const,
    title: 'Enter the Arena',
    body: 'Join elite eSports tournaments and battle the best players. Every match is your chance to prove yourself.',
    gradient: ['#200800', '#0A0A0A'] as [string, string],
    accent: '#FE4C11',
  },
  {
    id: '2',
    icon: 'pulse' as const,
    title: 'Track Live Battles',
    body: 'Follow matches in real time. Watch leaderboards shift as the competition heats up — stay in the action.',
    gradient: ['#000E1F', '#0A0A0A'] as [string, string],
    accent: '#3B82F6',
  },
  {
    id: '3',
    icon: 'wallet' as const,
    title: 'Win Real Rewards',
    body: 'Compete for prize pools paid directly to your wallet in Indian Rupees. Every match counts.',
    gradient: ['#051A00', '#0A0A0A'] as [string, string],
    accent: '#22C55E',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const goNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      router.replace('/(auth)/options');
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  };

  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient colors={slide.gradient} style={StyleSheet.absoluteFill} />

      {/* Skip — top right */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 12 }]}
          onPress={skip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, paddingTop: topPad + 60 }]}>
            {/* Icon */}
            <View style={[styles.iconRing, { borderColor: item.accent + '40' }]}>
              <View style={[styles.iconFill, { backgroundColor: item.accent + '16' }]}>
                <Ionicons name={item.icon} size={56} color={item.accent} />
              </View>
            </View>

            {/* Text */}
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>
          </View>
        )}
      />

      {/* Bottom section */}
      <View style={[styles.bottom, { paddingBottom: bottomPad + 28 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && { backgroundColor: slide.accent, width: 22, borderRadius: 4 },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: slide.accent }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <Ionicons
            name={isLast ? 'arrow-forward-circle-outline' : 'chevron-forward'}
            size={20}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {/* Page counter */}
        <Text style={styles.counter}>{activeIndex + 1} of {SLIDES.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  skipBtn: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  skipText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 200,
  },

  iconRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
  },
  iconFill: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slideTitle: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideBody: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#777777',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 25,
    gap: 16,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },

  cta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },

  counter: {
    color: '#3A3A3A',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
