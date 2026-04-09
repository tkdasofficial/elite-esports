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

const RANKS = [
  { pos: 1, name: 'ProSniper_X', score: '18 kills', prize: '₹2,100', accent: '#F59E0B', medal: 'medal-outline'  as const },
  { pos: 2, name: 'StormRider',  score: '14 kills', prize: '₹1,400', accent: '#9CA3AF', medal: 'medal-outline'  as const },
  { pos: 3, name: 'EliteGhost',  score: '12 kills', prize: '₹1,050', accent: '#CD7C3D', medal: 'ribbon-outline' as const },
];

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    gradientColors: dark
      ? (['#0D0800', '#070400', '#000000'] as const)
      : (['#FFFDF0', '#FDFAF5', '#FFFFFF'] as const),
    headline:      dark ? '#FFFFFF' : '#0A0A0A',
    subtext:       dark ? '#606060' : '#666666',
    eyebrowLine:   dark ? '#F59E0B50' : '#F59E0B70',
    iconGradColors: dark
      ? (['#F59E0B20', '#F59E0B06'] as const)
      : (['#F59E0B28', '#F59E0B0C'] as const),
    iconBorder:    dark ? '#F59E0B35' : '#F59E0B50',
    ringColors:    dark
      ? ['#F59E0B0C', '#F59E0B18', '#F59E0B28']
      : ['#F59E0B14', '#F59E0B22', '#F59E0B32'],
    prizePoolBg:   dark ? '#100A00' : '#FFFBEA',
    prizePoolBorder: dark ? '#F59E0B25' : '#F59E0B40',
    prizePoolTxt:  dark ? '#666666' : '#888888',
    boardRowBg:    dark ? '#0C0A06' : '#FDFAF2',
    boardRowBorder: dark ? '#1C1A12' : '#EDE8D8',
    posBoxBg:      dark ? '#0E0C08' : '#FFF8E6',
    playerName:    dark ? '#E0E0E0' : '#1A1A1A',
    playerScore:   dark ? '#444444' : '#888888',
    dotInactive:   dark ? '#222222' : '#CCCCCC',
    backBtnBg:     dark ? '#0E0E0E' : '#F0F0F0',
    backBtnBorder: dark ? '#1E1E1E' : '#E0E0E0',
    backBtnIcon:   dark ? '#444444' : '#999999',
  };
}

export default function WinScreen() {
  const insets = useSafeAreaInsets();
  const scaleNext = useSharedValue(1);
  const scaleBack = useSharedValue(1);
  const t = useTheme();

  const nextStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleNext.value }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleBack.value }] }));

  const topPad = insets.top;
  const botPad = insets.bottom + 8;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/Withdraw');
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
            <Ionicons name="trophy-outline" size={62} color="#F59E0B" />
          </LinearGradient>
        </View>

        <View style={[styles.prizePool, { backgroundColor: t.prizePoolBg, borderColor: t.prizePoolBorder }]}>
          <Ionicons name="cash-outline" size={14} color="#F59E0B" />
          <Text style={[styles.prizePoolTxt, { color: t.prizePoolTxt }]}>MONTHLY PRIZE POOL</Text>
          <Text style={styles.prizePoolAmt}>₹50,00,000</Text>
        </View>

        <View style={styles.board}>
          {RANKS.map((r) => (
            <View key={r.pos} style={[styles.boardRow, { backgroundColor: t.boardRowBg, borderColor: t.boardRowBorder }]}>
              <View style={[styles.posBox, { borderColor: r.accent + '45', backgroundColor: t.posBoxBg }]}>
                <Text style={[styles.posNum, { color: r.accent }]}>#{r.pos}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: t.playerName }]}>{r.name}</Text>
                <Text style={[styles.playerScore, { color: t.playerScore }]}>{r.score}</Text>
              </View>
              <View style={styles.prizeBox}>
                <Ionicons name={r.medal} size={13} color={r.accent} />
                <Text style={[styles.prizeAmt, { color: r.accent }]}>{r.prize}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.textBlock}>
        <View style={styles.eyebrow}>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
          <Text style={styles.eyebrowTxt}>LEADERBOARD</Text>
          <View style={[styles.eyebrowLine, { backgroundColor: t.eyebrowLine }]} />
        </View>
        <Text style={[styles.headline, { color: t.headline }]}>DOMINATE{'\n'}THE RANKS</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>
          Rise to the top and become an Elite Champion.
        </Text>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, { backgroundColor: t.dotInactive }]} />
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

        <Animated.View style={[styles.nextWrap, nextStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => { scaleNext.value = withTiming(0.96, { duration: 90 }); }}
            onPressOut={() => { scaleNext.value = withTiming(1.00, { duration: 120 }); }}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGrad}
            >
              <Text style={styles.nextTxt}>NEXT</Text>
              <Ionicons name="arrow-forward-outline" size={20} color="#000" />
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

  iconWrap: { marginBottom: 16 },
  iconGrad: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  prizePool: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 14, width: width - 48 },
  prizePoolTxt: { flex: 1, fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  prizePoolAmt: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F59E0B' },

  board: { width: width - 48, gap: 7 },
  boardRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  posBox: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  posNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  playerScore: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  prizeBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prizeAmt: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  textBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  eyebrowLine: { flex: 1, maxWidth: 32, height: 1 },
  eyebrowTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#F59E0B', letterSpacing: 2 },
  headline: { fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textAlign: 'center', lineHeight: 46, marginBottom: 12, textTransform: 'uppercase' },
  subtext: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: '#50C878' },

  cta: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, gap: 12, alignItems: 'center' },
  backBtn: { width: 58, height: 58, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  nextGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextTxt: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000000', letterSpacing: 2 },
});
