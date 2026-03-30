import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ILLUS_H = height * 0.48;
  const topPad = Platform.OS === 'web' ? Math.max(56, insets.top) : insets.top;
  const botPad = Platform.OS === 'web' ? Math.max(32, insets.bottom) : insets.bottom;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/Win');
  };

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>
      <LinearGradient
        colors={['#001A0D', '#000D06', '#000000']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Illustration ── */}
      <View style={[styles.illus, { height: ILLUS_H }]}>
        <View style={styles.ringOuter} />
        <View style={styles.ringMid} />

        <LinearGradient
          colors={['#50C87835', '#50C87808']}
          style={styles.iconCircle}
        >
          <Ionicons name="game-controller" size={76} color="#50C878" />
        </LinearGradient>

        <View style={[styles.badge, styles.badgeTL]}>
          <Ionicons name="flame" size={13} color="#FF6B35" />
          <Text style={[styles.badgeTxt, { color: '#FF6B35' }]}>FREE FIRE</Text>
        </View>
        <View style={[styles.badge, styles.badgeTR]}>
          <Ionicons name="skull" size={13} color="#50C878" />
          <Text style={[styles.badgeTxt, { color: '#50C878' }]}>BGMI</Text>
        </View>
        <View style={[styles.badge, styles.badgeBL]}>
          <Ionicons name="flash" size={13} color="#A78BFA" />
          <Text style={[styles.badgeTxt, { color: '#A78BFA' }]}>DAILY</Text>
        </View>
        <View style={[styles.badge, styles.badgeBR]}>
          <Ionicons name="trophy" size={13} color="#F59E0B" />
          <Text style={[styles.badgeTxt, { color: '#F59E0B' }]}>WIN CASH</Text>
        </View>

        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTxt}>LIVE TOURNAMENTS</Text>
        </View>
      </View>

      {/* ── Text ── */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>JOIN THE{'\n'}BATTLE</Text>
        <Text style={styles.subtext}>
          Enter daily tournaments for Free Fire and BGMI.
        </Text>
      </View>

      {/* ── Dots ── */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotInactive]} />
        <View style={[styles.dot, styles.dotInactive]} />
      </View>

      {/* ── Button ── */}
      <View style={styles.cta}>
        <Animated.View style={[styles.btnWrap, btnStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => { scale.value = withTiming(0.96, { duration: 90 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 110 }); }}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnTxt}>NEXT</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const RING = width * 0.72;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },

  illus: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1,
    borderColor: '#50C87818',
  },
  ringMid: {
    position: 'absolute',
    width: RING * 0.7,
    height: RING * 0.7,
    borderRadius: RING * 0.35,
    borderWidth: 1,
    borderColor: '#50C87828',
  },
  iconCircle: {
    width: 152,
    height: 152,
    borderRadius: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#50C87840',
  },

  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0E1A12',
    borderWidth: 1,
    borderColor: '#1E3025',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeTxt: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  badgeTL: { top: '16%', left: '5%' },
  badgeTR: { top: '16%', right: '5%' },
  badgeBL: { bottom: '16%', left: '5%' },
  badgeBR: { bottom: '16%', right: '5%' },

  livePill: {
    position: 'absolute',
    bottom: '6%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A1A0F',
    borderWidth: 1,
    borderColor: '#50C87440',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#50C878' },
  liveTxt: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#50C878', letterSpacing: 1 },

  textBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  subtext: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28, backgroundColor: '#50C878' },
  dotInactive: { width: 8, backgroundColor: '#2A2A2A' },

  cta: { width: '100%', paddingHorizontal: 28, paddingBottom: 8 },
  btnWrap: { borderRadius: 16, overflow: 'hidden' },
  btnGrad: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
  },
  btnTxt: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
    letterSpacing: 1.5,
  },
});
