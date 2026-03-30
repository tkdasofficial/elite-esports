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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const METHODS = [
  { icon: 'phone-portrait' as const, label: 'UPI',    color: '#50C878' },
  { icon: 'wallet'         as const, label: 'Wallet', color: '#3B82F6' },
  { icon: 'card'           as const, label: 'Bank',   color: '#A78BFA' },
];

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const scaleStart = useSharedValue(1);
  const scaleBack  = useSharedValue(1);

  const startStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleStart.value }] }));
  const backStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scaleBack.value }] }));

  const ILLUS_H = height * 0.48;
  const topPad = Platform.OS === 'web' ? Math.max(56, insets.top) : insets.top;
  const botPad = Platform.OS === 'web' ? Math.max(32, insets.bottom) : insets.bottom;

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  };
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
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
        <View style={styles.glowRing} />

        <LinearGradient
          colors={['#50C87830', '#50C87806']}
          style={styles.walletCircle}
        >
          <Ionicons name="wallet" size={72} color="#50C878" />
        </LinearGradient>

        <View style={[styles.coinBadge, styles.coinTL]}>
          <Ionicons name="logo-bitcoin" size={16} color="#F59E0B" />
          <Text style={styles.coinAmt}>+₹500</Text>
        </View>
        <View style={[styles.coinBadge, styles.coinTR]}>
          <Ionicons name="cash" size={16} color="#50C878" />
          <Text style={[styles.coinAmt, { color: '#50C878' }]}>+₹1,200</Text>
        </View>
        <View style={[styles.coinBadge, styles.coinBR]}>
          <Ionicons name="diamond" size={14} color="#A78BFA" />
          <Text style={[styles.coinAmt, { color: '#A78BFA' }]}>+₹250</Text>
        </View>

        <View style={styles.methodRow}>
          {METHODS.map((m) => (
            <View key={m.label} style={styles.methodCard}>
              <View style={[styles.methodIcon, {
                borderColor: m.color + '40',
                backgroundColor: m.color + '12',
              }]}>
                <Ionicons name={m.icon} size={22} color={m.color} />
              </View>
              <Text style={styles.methodLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.instantPill}>
          <View style={styles.instantDot} />
          <Text style={styles.instantTxt}>INSTANT WITHDRAWAL</Text>
        </View>
      </View>

      {/* ── Text ── */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>INSTANT{'\n'}REWARDS</Text>
        <Text style={styles.subtext}>
          Get your winnings directly in your UPI or Wallet.{'\n'}Zero delay.
        </Text>
      </View>

      {/* ── Dots ── */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotInactive]} />
        <View style={[styles.dot, styles.dotInactive]} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* ── Buttons ── */}
      <View style={styles.cta}>
        <Animated.View style={backStyle}>
          <Pressable
            onPress={handleBack}
            onPressIn={() => { scaleBack.value = withTiming(0.94, { duration: 90 }); }}
            onPressOut={() => { scaleBack.value = withTiming(1, { duration: 110 }); }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#666" />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.startBtnWrap, startStyle]}>
          <Pressable
            onPress={handleStart}
            onPressIn={() => { scaleStart.value = withTiming(0.96, { duration: 90 }); }}
            onPressOut={() => { scaleStart.value = withTiming(1, { duration: 110 }); }}
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
  root: { flex: 1, alignItems: 'center' },

  illus: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.31,
    backgroundColor: '#50C87807',
    borderWidth: 1,
    borderColor: '#50C87820',
  },
  walletCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#50C87840',
    marginBottom: 22,
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
    paddingVertical: 6,
  },
  coinAmt: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F59E0B' },
  coinTL: { top: '12%', left: '7%' },
  coinTR: { top: '12%', right: '7%' },
  coinBR: { bottom: '28%', right: '7%' },

  methodRow: { flexDirection: 'row', gap: 18 },
  methodCard: { alignItems: 'center', gap: 7 },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#555', letterSpacing: 0.4 },

  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#0A1A0F',
    borderWidth: 1,
    borderColor: '#50C87840',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  instantDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#50C878' },
  instantTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#50C878', letterSpacing: 1 },

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

  dots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28, backgroundColor: '#50C878' },
  dotInactive: { width: 8, backgroundColor: '#2A2A2A' },

  cta: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
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
    color: '#000000',
    letterSpacing: 1.5,
  },
});
