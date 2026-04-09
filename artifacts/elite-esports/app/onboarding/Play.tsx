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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const STATS = [
  { icon: 'calendar-outline' as const, label: 'Daily Tournaments' },
  { icon: 'people-outline'   as const, label: '10K+ Players'      },
  { icon: 'cash-outline'     as const, label: 'Cash Prizes'       },
];

const GAMES = [
  { icon: 'flame-outline' as const, label: 'Free Fire', accent: '#EE3D2D' },
  { icon: 'skull-outline' as const, label: 'BGMI',      accent: '#50C878' },
];

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    gradientColors: dark
      ? (['#001408', '#000A04', '#000000'] as const)
      : (['#F0FFF6', '#F7FFF9', '#FFFFFF'] as const),
    headline:     dark ? '#FFFFFF' : '#0A0A0A',
    subtext:      dark ? '#606060' : '#666666',
    eyebrowLine:  dark ? '#50C87860' : '#50C87880',
    iconGradColors: dark
      ? (['#50C87822', '#50C87806'] as const)
      : (['#50C87830', '#50C87810'] as const),
    iconBorder:   dark ? '#50C87840' : '#50C87860',
    gameTagBg:    dark ? '#060E08' : '#F0FFF4',
    ringColors:   dark
      ? ['#50C87810', '#50C87820', '#50C87830']
      : ['#50C87818', '#50C87828', '#50C87838'],
    divider:      dark ? '#1A1A1A' : '#E0E0E0',
    statLabel:    dark ? '#555555' : '#888888',
    statSep:      dark ? '#1E1E1E' : '#DDDDDD',
    dotInactive:  dark ? '#222222' : '#CCCCCC',
  };
}

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const t = useTheme();

  const topPad = insets.top;
  const botPad = insets.bottom + 8;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/Win');
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
            <Ionicons name="game-controller-outline" size={64} color="#50C878" />
          </LinearGradient>
        </View>

        <View style={styles.gameTags}>
          {GAMES.map((g) => (
            <View key={g.label} style={[styles.gameTag, { borderColor: g.accent + '50', backgroundColor: t.gameTagBg }]}>
              <Ionicons name={g.icon} size={14} color={g.accent} />
              <Text style={[styles.gameTagTxt, { color: g.accent }]}>{g.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: t.divider }]} />

        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Ionicons name={s.icon} size={18} color="#50C878" />
                <Text style={[styles.statLabel, { color: t.statLabel }]}>{s.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={[styles.statSep, { backgroundColor: t.statSep }]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.textBlock}>
        <View style={styles.eyebrow}>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
          <Text style={styles.eyebrowTxt}>ELITE eSPORTS</Text>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
        </View>
        <Text style={[styles.headline, { color: t.headline }]}>JOIN THE{'\n'}BATTLE</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>
          Compete in daily tournaments and win real cash.
        </Text>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
      </View>

      <View style={styles.cta}>
        <Animated.View style={[styles.btnWrap, btnStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => { scale.value = withTiming(0.96, { duration: 90 }); }}
            onPressOut={() => { scale.value = withTiming(1.00, { duration: 120 }); }}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnTxt}>NEXT</Text>
              <Ionicons name="arrow-forward-outline" size={20} color="#000" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const R1 = width * 0.44;
const R2 = width * 0.60;
const R3 = width * 0.76;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },

  illus: {
    width,
    height: height * 0.50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring3: { position: 'absolute', width: R3, height: R3, borderRadius: R3 / 2, borderWidth: 1 },
  ring2: { position: 'absolute', width: R2, height: R2, borderRadius: R2 / 2, borderWidth: 1 },
  ring1: { position: 'absolute', width: R1, height: R1, borderRadius: R1 / 2, borderWidth: 1 },

  iconWrap: { marginBottom: 24 },
  iconGrad: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  gameTags: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  gameTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  gameTagTxt: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.6 },

  divider: { width: width * 0.55, height: 1, marginBottom: 20 },

  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center', letterSpacing: 0.3 },
  statSep: { width: 1, height: 28 },

  textBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  eyebrowLine: { flex: 1, maxWidth: 32, height: 1 },
  eyebrowTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#50C878', letterSpacing: 2 },
  headline: { fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textAlign: 'center', lineHeight: 46, marginBottom: 12, textTransform: 'uppercase' },
  subtext: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: '#50C878' },

  cta: { width: '100%', paddingHorizontal: 24 },
  btnWrap: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnTxt: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000000', letterSpacing: 2 },
});
