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

const PAYOUTS = [
  { icon: 'phone-portrait-outline' as const, name: 'via UPI',  amt: '+₹1,200', color: '#50C878', time: '2 min ago'  },
  { icon: 'card-outline'           as const, name: 'via Bank', amt: '+₹3,500', color: '#3B82F6', time: '14 min ago' },
  { icon: 'wallet-outline'         as const, name: 'Wallet',   amt: '+₹800',   color: '#A78BFA', time: '1 hr ago'   },
];

const METHODS = [
  { icon: 'phone-portrait-outline' as const, label: 'UPI',    color: '#50C878' },
  { icon: 'card-outline'           as const, label: 'Bank',   color: '#3B82F6' },
  { icon: 'wallet-outline'         as const, label: 'Wallet', color: '#A78BFA' },
];

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const scaleStart = useSharedValue(1);
  const scaleBack  = useSharedValue(1);

  const startStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleStart.value }] }));
  const backStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scaleBack.value }] }));

  const topPad = insets.top;
  const botPad = insets.bottom + 8;

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
        colors={['#001408', '#000A04', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Illustration ── */}
      <View style={styles.illus}>
        {/* Rings */}
        <View style={styles.ring3} />
        <View style={styles.ring2} />
        <View style={styles.ring1} />

        {/* Wallet icon */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#50C87822', '#50C87806']}
            style={styles.iconGrad}
          >
            <Ionicons name="wallet-outline" size={62} color="#50C878" />
          </LinearGradient>
        </View>

        {/* Recent payouts */}
        <View style={styles.payouts}>
          <View style={styles.payoutsHeader}>
            <Ionicons name="time-outline" size={13} color="#444" />
            <Text style={styles.payoutsHeaderTxt}>RECENT PAYOUTS</Text>
          </View>
          {PAYOUTS.map((p) => (
            <View key={p.name} style={styles.payoutRow}>
              <View style={[styles.payoutIcon, { borderColor: p.color + '35', backgroundColor: p.color + '10' }]}>
                <Ionicons name={p.icon} size={16} color={p.color} />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutName}>{p.name}</Text>
                <Text style={styles.payoutTime}>{p.time}</Text>
              </View>
              <Text style={[styles.payoutAmt, { color: p.color }]}>{p.amt}</Text>
            </View>
          ))}
        </View>

        {/* Method strip */}
        <View style={styles.methodStrip}>
          {METHODS.map((m, i) => (
            <React.Fragment key={m.label}>
              <View style={styles.methodItem}>
                <Ionicons name={m.icon} size={16} color={m.color} />
                <Text style={[styles.methodLabel, { color: m.color }]}>{m.label}</Text>
              </View>
              {i < METHODS.length - 1 && <View style={styles.methodSep} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Text ── */}
      <View style={styles.textBlock}>
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrowTxt}>ZERO DELAY</Text>
          <View style={styles.eyebrowLine} />
        </View>
        <Text style={styles.headline}>INSTANT{'\n'}REWARDS</Text>
        <Text style={styles.subtext}>
          Withdraw winnings to your UPI or bank account instantly.
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
            onPressOut={() => { scaleBack.value = withTiming(1.00, { duration: 120 }); }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={22} color="#444" />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.startWrap, startStyle]}>
          <Pressable
            onPress={handleStart}
            onPressIn={() => { scaleStart.value = withTiming(0.96, { duration: 90 }); }}
            onPressOut={() => { scaleStart.value = withTiming(1.00, { duration: 120 }); }}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startGrad}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
              <Text style={styles.startTxt}>GET STARTED</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const R1 = width * 0.42;
const R2 = width * 0.58;
const R3 = width * 0.74;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },

  illus: {
    width,
    height: height * 0.50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring3: {
    position: 'absolute',
    width: R3, height: R3, borderRadius: R3 / 2,
    borderWidth: 1, borderColor: '#50C87810',
  },
  ring2: {
    position: 'absolute',
    width: R2, height: R2, borderRadius: R2 / 2,
    borderWidth: 1, borderColor: '#50C87820',
  },
  ring1: {
    position: 'absolute',
    width: R1, height: R1, borderRadius: R1 / 2,
    borderWidth: 1, borderColor: '#50C87830',
  },

  iconWrap: { marginBottom: 18 },
  iconGrad: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#50C87840',
  },

  payouts: {
    width: width - 48,
    backgroundColor: '#060E08',
    borderWidth: 1,
    borderColor: '#0E2014',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  payoutsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0E2014',
  },
  payoutsHeaderTxt: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#444',
    letterSpacing: 1.2,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0A180C',
  },
  payoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutInfo: { flex: 1 },
  payoutName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#D0D0D0',
    marginBottom: 2,
  },
  payoutTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#3A3A3A',
  },
  payoutAmt: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },

  methodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#060E08',
    borderWidth: 1,
    borderColor: '#0E2014',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: width - 48,
  },
  methodItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  methodLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  methodSep: {
    width: 1,
    height: 20,
    backgroundColor: '#141A16',
  },

  textBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  eyebrowLine: {
    flex: 1,
    maxWidth: 32,
    height: 1,
    backgroundColor: '#50C87860',
  },
  eyebrowTxt: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#50C878',
    letterSpacing: 2,
  },
  headline: {
    fontSize: 38,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  subtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#606060',
    textAlign: 'center',
    lineHeight: 22,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: '#50C878' },
  dotInactive: { width: 6, backgroundColor: '#222222' },

  cta: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  startGrad: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startTxt: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
    letterSpacing: 2,
  },
});
