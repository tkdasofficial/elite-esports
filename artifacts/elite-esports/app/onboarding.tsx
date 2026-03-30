import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withSpring, interpolate, Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    number: '01',
    icon: 'trophy' as const,
    label: 'TOURNAMENTS',
    title: 'Enter the\nArena',
    body: 'Join elite eSports tournaments and battle the best players. Every match is your chance to prove yourself.',
    bg: '#0A0A0A',
    gradTop: ['#3D1100', '#200800', '#0A0A0A'] as [string, string, string],
    accent: '#FE4C11',
    dimAccent: '#7A2508',
    ringA: '#FE4C1122',
    ringB: '#FE4C1110',
  },
  {
    id: '2',
    number: '02',
    icon: 'pulse' as const,
    label: 'LIVE MATCHES',
    title: 'Track Live\nBattles',
    body: 'Follow matches in real time. Watch leaderboards shift as the competition heats up — stay in the action.',
    bg: '#0A0A0A',
    gradTop: ['#001A3D', '#000E1F', '#0A0A0A'] as [string, string, string],
    accent: '#3B82F6',
    dimAccent: '#1A3A6E',
    ringA: '#3B82F622',
    ringB: '#3B82F610',
  },
  {
    id: '3',
    number: '03',
    icon: 'wallet' as const,
    label: 'REAL REWARDS',
    title: 'Win Real\nRewards',
    body: 'Compete for prize pools paid directly to your wallet in Indian Rupees. Every match counts.',
    bg: '#0A0A0A',
    gradTop: ['#003818', '#051A00', '#0A0A0A'] as [string, string, string],
    accent: '#22C55E',
    dimAccent: '#0E5A2A',
    ringA: '#22C55E22',
    ringB: '#22C55E10',
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<typeof SLIDES[0]>);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goNext = useCallback(async () => {
    ctaScale.value = withSpring(0.94, { damping: 10 }, () => {
      ctaScale.value = withSpring(1);
    });
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      router.replace('/(auth)/options');
    }
  }, [activeIndex]);

  const skip = useCallback(async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  }, []);

  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background gradient — updates with active slide */}
      <LinearGradient
        colors={slide.gradTop}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Large ambient glow disc behind content */}
      <View
        style={[
          styles.glowDisc,
          { backgroundColor: slide.accent + '12', top: topPad + 20 },
        ]}
      />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 16 }]}
          onPress={skip}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={12} color="#666" />
        </TouchableOpacity>
      )}

      {/* Slide number top-left */}
      <View style={[styles.slideNumWrap, { top: topPad + 16 }]}>
        <Text style={[styles.slideNum, { color: slide.accent + '55' }]}>
          {slide.number}
        </Text>
        <Text style={[styles.slideNumOf, { color: slide.accent + '30' }]}>
          /{SLIDES.length.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Slides */}
      <AnimatedFlatList
        ref={flatListRef as any}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        renderItem={({ item, index }) => (
          <SlideItem
            item={item}
            index={index}
            scrollX={scrollX}
            topPad={topPad}
          />
        )}
      />

      {/* Bottom section */}
      <View style={[styles.bottom, { paddingBottom: bottomPad + 24 }]}>

        {/* Progress track */}
        <ProgressBar
          total={SLIDES.length}
          activeIndex={activeIndex}
          accent={slide.accent}
        />

        {/* CTA button */}
        <Animated.View style={[styles.ctaWrap, ctaAnimStyle]}>
          <TouchableOpacity
            style={styles.ctaTouchable}
            onPress={goNext}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[slide.accent, slide.dimAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
              <View style={styles.ctaIconBg}>
                <Ionicons
                  name={isLast ? 'flash' : 'arrow-forward'}
                  size={17}
                  color={slide.accent}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms hint on last slide */}
        {isLast ? (
          <Text style={styles.termsHint}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        ) : (
          <Text style={styles.swipeHint}>
            {activeIndex + 1} of {SLIDES.length}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ─── Slide item ─────────────────────────────────────────────────────────── */
function SlideItem({
  item,
  index,
  scrollX,
  topPad,
}: {
  item: typeof SLIDES[0];
  index: number;
  scrollX: Animated.SharedValue<number>;
  topPad: number;
}) {
  const iconWrapStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [40, 0, 40], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  });

  const textWrapStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { width, paddingTop: topPad + 80 }]}>

      {/* Decorative outer ring */}
      <Animated.View style={[styles.iconOuterRing, { borderColor: item.ringB }, iconWrapStyle]}>
        {/* Middle ring */}
        <View style={[styles.iconMidRing, { borderColor: item.ringA }]}>
          {/* Inner glow fill */}
          <LinearGradient
            colors={[item.accent + '28', item.accent + '08']}
            style={styles.iconInnerFill}
          >
            {/* Icon container */}
            <View style={[styles.iconBox, { backgroundColor: item.accent + '18', borderColor: item.accent + '40' }]}>
              <Ionicons name={item.icon} size={48} color={item.accent} />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Label chip */}
      <Animated.View style={[textWrapStyle, { alignItems: 'center' }]}>
        <View style={[styles.labelChip, { borderColor: item.accent + '35', backgroundColor: item.accent + '12' }]}>
          <View style={[styles.labelDot, { backgroundColor: item.accent }]} />
          <Text style={[styles.labelText, { color: item.accent }]}>{item.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.slideTitle}>{item.title}</Text>

        {/* Accent underline */}
        <View style={[styles.titleUnderline, { backgroundColor: item.accent }]} />

        {/* Body */}
        <Text style={styles.slideBody}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

/* ─── Progress bar ──────────────────────────────────────────────────────── */
function ProgressBar({
  total, activeIndex, accent,
}: {
  total: number;
  activeIndex: number;
  accent: string;
}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.progressSeg,
              {
                backgroundColor: done ? accent + 'AA' : active ? accent : '#2A2A2A',
                flex: active ? 2 : 1,
                height: active ? 4 : 3,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  glowDisc: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    alignSelf: 'center',
  },

  skipBtn: {
    position: 'absolute',
    right: 22,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  skipText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },

  slideNumWrap: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  slideNum: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  slideNumOf: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 220,
    gap: 0,
  },

  iconOuterRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconMidRing: {
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconInnerFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  labelDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },

  slideTitle: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: 12,
  },
  titleUnderline: {
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 20,
  },
  slideBody: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#636363',
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 310,
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    alignItems: 'center',
  },
  progressSeg: {
    borderRadius: 4,
    overflow: 'hidden',
  },

  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ctaTouchable: {
    width: '100%',
  },
  ctaGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  ctaIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  swipeHint: {
    color: '#303030',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  termsHint: {
    color: '#383838',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 17,
  },
});
