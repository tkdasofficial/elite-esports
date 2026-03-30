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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const ILLUSTRATION_H = height * 0.5;

interface Props {
  onBack: () => void;
}

const PAYMENT_METHODS = [
  { icon: 'phone-portrait', label: 'UPI', color: '#50C878' },
  { icon: 'wallet', label: 'Wallet', color: '#3B82F6' },
  { icon: 'card', label: 'Bank', color: '#A78BFA' },
];

export function Withdraw({ onBack }: Props) {
  const scaleStart = useSharedValue(1);
  const scaleBack = useSharedValue(1);

  const startStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleStart.value }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleBack.value }],
  }));

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBack();
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
        {/* Outer glow */}
        <View style={styles.glowRing} />

        {/* Wallet icon */}
        <LinearGradient
          colors={['#50C87828', '#50C87806']}
          style={styles.walletCircle}
        >
          <Ionicons name="wallet" size={68} color="#50C878" />
        </LinearGradient>

        {/* Floating coins */}
        <View style={[styles.coinBadge, styles.coinTL]}>
          <Ionicons name="logo-bitcoin" size={18} color="#F59E0B" />
          <Text style={styles.coinAmt}>+₹500</Text>
        </View>
        <View style={[styles.coinBadge, styles.coinTR]}>
          <Ionicons name="cash" size={18} color="#50C878" />
          <Text style={[styles.coinAmt, { color: '#50C878' }]}>+₹1200</Text>
        </View>
        <View style={[styles.coinBadge, styles.coinBM]}>
          <Ionicons name="diamond" size={16} color="#A78BFA" />
          <Text style={[styles.coinAmt, { color: '#A78BFA' }]}>+₹250</Text>
        </View>

        {/* Payment methods row */}
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((m) => (
            <View key={m.label} style={styles.methodCard}>
              <View style={[styles.methodIcon, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                <Ionicons name={m.icon as any} size={20} color={m.color} />
              </View>
              <Text style={styles.methodLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Instant tag */}
        <View style={styles.instantPill}>
          <Ionicons name="flash" size={12} color="#50C878" />
          <Text style={styles.instantTxt}>INSTANT WITHDRAWAL</Text>
        </View>
      </View>

      {/* ─── Text Block ─── */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>INSTANT{'\n'}REWARDS</Text>
        <Text style={styles.subtext}>
          Get your winnings directly in your UPI or Wallet.{'\n'}Zero delay.
        </Text>
      </View>

      {/* ─── CTA ─── */}
      <View style={styles.ctaArea}>
        <Animated.View style={[styles.backBtnWrap, backStyle]}>
          <Pressable
            onPress={handleBack}
            onPressIn={() => { scaleBack.value = withTiming(0.94, { duration: 100 }); }}
            onPressOut={() => { scaleBack.value = withTiming(1, { duration: 120 }); }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#666" />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.startBtnWrap, startStyle]}>
          <Pressable
            onPress={handleStart}
            onPressIn={() => { scaleStart.value = withTiming(0.96, { duration: 100 }); }}
            onPressOut={() => { scaleStart.value = withTiming(1, { duration: 120 }); }}
            style={styles.pressable}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startGrad}
            >
              <Ionicons name="flash" size={18} color="#000" />
              <Text style={styles.startTxt}>GET STARTED</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

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

  glowRing: {
    position: 'absolute',
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.31,
    backgroundColor: '#50C87806',
    borderWidth: 1,
    borderColor: '#50C87820',
  },

  walletCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#50C87840',
    marginBottom: 24,
  },

  coinBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0A140C',
    borderWidth: 1,
    borderColor: '#1A2E1E',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  coinAmt: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#F59E0B',
  },
  coinTL: { top: '14%', left: '8%' },
  coinTR: { top: '14%', right: '8%' },
  coinBM: { bottom: '30%', right: '8%' },

  methodRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  methodCard: {
    alignItems: 'center',
    gap: 6,
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
    letterSpacing: 0.5,
  },

  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    backgroundColor: '#0A1A0F',
    borderWidth: 1,
    borderColor: '#50C87840',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  instantTxt: {
    fontSize: 10,
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
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  backBtnWrap: {},
  backBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  pressable: { borderRadius: 16, overflow: 'hidden' },
  startGrad: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
  },
  startTxt: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 1.5,
  },
});
