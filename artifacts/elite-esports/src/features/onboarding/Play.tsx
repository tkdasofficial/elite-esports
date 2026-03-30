import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const ILLUSTRATION_H = height * 0.5;

interface Props {
  onNext: () => void;
}

export function Play({ onNext }: Props) {
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#001A0D', '#000D06', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── Illustration Area ─── */}
      <View style={[styles.illustration, { height: ILLUSTRATION_H }]}>
        {/* Outer glow ring */}
        <View style={styles.ringOuter} />
        <View style={styles.ringMid} />

        {/* Central icon */}
        <LinearGradient
          colors={['#50C87830', '#50C87808']}
          style={styles.iconCircle}
        >
          <Ionicons name="game-controller" size={72} color="#50C878" />
        </LinearGradient>

        {/* Floating badges */}
        <View style={[styles.floatBadge, styles.badgeTL]}>
          <Ionicons name="flame" size={14} color="#FF6B35" />
          <Text style={[styles.badgeTxt, { color: '#FF6B35' }]}>FREE FIRE</Text>
        </View>
        <View style={[styles.floatBadge, styles.badgeTR]}>
          <Ionicons name="skull" size={14} color="#50C878" />
          <Text style={[styles.badgeTxt, { color: '#50C878' }]}>BGMI</Text>
        </View>
        <View style={[styles.floatBadge, styles.badgeBL]}>
          <Ionicons name="flash" size={14} color="#A78BFA" />
          <Text style={[styles.badgeTxt, { color: '#A78BFA' }]}>DAILY</Text>
        </View>
        <View style={[styles.floatBadge, styles.badgeBR]}>
          <Ionicons name="trophy" size={14} color="#F59E0B" />
          <Text style={[styles.badgeTxt, { color: '#F59E0B' }]}>WIN CASH</Text>
        </View>

        {/* Live pill */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTxt}>LIVE TOURNAMENTS</Text>
        </View>
      </View>

      {/* ─── Text Block ─── */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>JOIN THE{'\n'}BATTLE</Text>
        <Text style={styles.subtext}>
          Enter daily tournaments for Free Fire and BGMI.
        </Text>
      </View>

      {/* ─── CTA ─── */}
      <View style={styles.ctaArea}>
        <Animated.View style={[styles.btnWrap, btnStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => { scale.value = withTiming(0.96, { duration: 100 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
            style={styles.pressable}
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
  root: {
    flex: 1,
    alignItems: 'center',
  },

  illustration: {
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
    width: RING * 0.72,
    height: RING * 0.72,
    borderRadius: RING * 0.36,
    borderWidth: 1,
    borderColor: '#50C87830',
  },

  iconCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#50C87840',
  },

  floatBadge: {
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
  badgeTxt: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  badgeTL: { top: '18%', left: '6%' },
  badgeTR: { top: '18%', right: '6%' },
  badgeBL: { bottom: '18%', left: '6%' },
  badgeBR: { bottom: '18%', right: '6%' },

  livePill: {
    position: 'absolute',
    bottom: '8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A1A0F',
    borderWidth: 1,
    borderColor: '#50C87840',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#50C878',
  },
  liveTxt: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#50C878',
    letterSpacing: 1,
  },

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
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  ctaArea: {
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  btnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
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
    color: '#000',
    letterSpacing: 1.5,
  },
});
