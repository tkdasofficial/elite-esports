import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  useColorScheme,
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

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    gradientColors: dark
      ? (['#001408', '#000A04', '#000000'] as const)
      : (['#F0FFF6', '#F7FFF9', '#FFFFFF'] as const),
    headline:      dark ? '#FFFFFF' : '#0A0A0A',
    subtext:       dark ? '#606060' : '#666666',
    eyebrowLine:   dark ? '#50C87860' : '#50C87880',
    iconGradColors: dark
      ? (['#50C87822', '#50C87806'] as const)
      : (['#50C87830', '#50C87810'] as const),
    iconBorder:    dark ? '#50C87840' : '#50C87860',
    ringColors:    dark
      ? ['#50C87810', '#50C87820', '#50C87830']
      : ['#50C87818', '#50C87828', '#50C87838'],
    payoutsBg:     dark ? '#060E08' : '#F2FFF5',
    payoutsBorder: dark ? '#0E2014' : '#D4EED9',
    payoutsHeaderTxt: dark ? '#444444' : '#888888',
    payoutRowBorder: dark ? '#0A180C' : '#E0F0E3',
    payoutName:    dark ? '#D0D0D0' : '#1A1A1A',
    payoutTime:    dark ? '#3A3A3A' : '#AAAAAA',
    methodSep:     dark ? '#141A16' : '#D4EED9',
    dotInactive:   dark ? '#222222' : '#CCCCCC',
    backBtnBg:     dark ? '#0E0E0E' : '#F0F0F0',
    backBtnBorder: dark ? '#1E1E1E' : '#E0E0E0',
    backBtnIcon:   dark ? '#444444' : '#999999',
  };
}

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const scaleStart = useSharedValue(1);
  const scaleBack  = useSharedValue(1);
  const t = useTheme();

  const startStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleStart.value }] }));
  const backStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scaleBack.value }] }));

  const topPad = insets.top;
  const botPad = insets.bottom + 8;

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/email-verify');
  };
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>
      <LinearGradient
        colors={t.gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.illus}>
        <View style={[styles.ring3, { borderColor: t.ringColors[0] }]} />
        <View style={[styles.ring2, { borderColor: t.ringColors[1] }]} />
        <View style={[styles.ring1, { borderColor: t.ringColors[2] }]} />

        <View style={styles.iconWrap}>
          <LinearGradient colors={t.iconGradColors} style={[styles.iconGrad, { borderColor: t.iconBorder }]}>
            <Ionicons name="wallet-outline" size={62} color="#50C878" />
          </LinearGradient>
        </View>

        <View style={[styles.payouts, { backgroundColor: t.payoutsBg, borderColor: t.payoutsBorder }]}>
          <View style={[styles.payoutsHeader, { borderBottomColor: t.payoutsBorder }]}>
            <Ionicons name="time-outline" size={13} color="#50C878" />
            <Text style={[styles.payoutsHeaderTxt, { color: t.payoutsHeaderTxt }]}>RECENT PAYOUTS</Text>
          </View>
          {PAYOUTS.map((p) => (
            <View key={p.name} style={[styles.payoutRow, { borderBottomColor: t.payoutRowBorder }]}>
              <View style={[styles.payoutIcon, { borderColor: p.color + '35', backgroundColor: p.color + '10' }]}>
                <Ionicons name={p.icon} size={16} color={p.color} />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={[styles.payoutName, { color: t.payoutName }]}>{p.name}</Text>
                <Text style={[styles.payoutTime, { color: t.payoutTime }]}>{p.time}</Text>
              </View>
              <Text style={[styles.payoutAmt, { color: p.color }]}>{p.amt}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.methodStrip, { backgroundColor: t.payoutsBg, borderColor: t.payoutsBorder }]}>
          {METHODS.map((m, i) => (
            <React.Fragment key={m.label}>
              <View style={styles.methodItem}>
                <Ionicons name={m.icon} size={16} color={m.color} />
                <Text style={[styles.methodLabel, { color: m.color }]}>{m.label}</Text>
              </View>
              {i < METHODS.length - 1 && <View style={[styles.methodSep, { backgroundColor: t.methodSep }]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.textBlock}>
        <View style={styles.eyebrow}>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
          <Text style={styles.eyebrowTxt}>ZERO DELAY</Text>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
        </View>
        <Text style={[styles.headline, { color: t.headline }]}>INSTANT{'\n'}REWARDS</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>
          Withdraw winnings to your UPI or bank account instantly.
        </Text>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <View style={styles.cta}>
        <Animated.View style={backStyle}>
          <Pressable
            onPress={handleBack}
            onPressIn={() => { scaleBack.value = withTiming(0.94, { duration: 90 }); }}
            onPressOut={() => { scaleBack.value = withTiming(1.00, { duration: 120 }); }}
            style={[styles.backBtn, { backgroundColor: t.backBtnBg, borderColor: t.backBtnBorder }]}
          >
            <Ionicons name="arrow-back-outline" size={22} color={t.backBtnIcon} />
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

  illus: { width, height: height * 0.50, alignItems: 'center', justifyContent: 'center' },

  ring3: { position: 'absolute', width: R3, height: R3, borderRadius: R3 / 2, borderWidth: 1 },
  ring2: { position: 'absolute', width: R2, height: R2, borderRadius: R2 / 2, borderWidth: 1 },
  ring1: { position: 'absolute', width: R1, height: R1, borderRadius: R1 / 2, borderWidth: 1 },

  iconWrap: { marginBottom: 18 },
  iconGrad: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  payouts: { width: width - 48, borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  payoutsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  payoutsHeaderTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 12, borderBottomWidth: 1 },
  payoutIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  payoutInfo: { flex: 1 },
  payoutName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  payoutTime: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  payoutAmt: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  methodStrip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, width: width - 48 },
  methodItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  methodLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  methodSep: { width: 1, height: 20 },

  textBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  eyebrowLine: { flex: 1, maxWidth: 32, height: 1 },
  eyebrowTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#50C878', letterSpacing: 2 },
  headline: { fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textAlign: 'center', lineHeight: 46, marginBottom: 12, textTransform: 'uppercase' },
  subtext: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: '#50C878' },

  cta: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, gap: 12, alignItems: 'center' },
  backBtn: { width: 58, height: 58, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  startWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  startGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startTxt: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000000', letterSpacing: 2 },
});
