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
  useSharedValue, useAnimatedStyle, withSpring,
  useAnimatedScrollHandler, interpolate, Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<number>);

const TOTAL = 3;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const onScroll = useAnimatedScrollHandler(e => {
    scrollX.value = e.contentOffset.x;
  });

  const goNext = useCallback(async () => {
    ctaScale.value = withSpring(0.93, { damping: 8 }, () => {
      ctaScale.value = withSpring(1, { damping: 10 });
    });
    if (active < TOTAL - 1) {
      const n = active + 1;
      flatRef.current?.scrollToIndex({ index: n, animated: true });
      setActive(n);
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      router.replace('/(auth)/options');
    }
  }, [active]);

  const skip = useCallback(async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  }, []);

  const isLast = active === TOTAL - 1;
  const accent = active === 0 ? '#FE4C11' : active === 1 ? '#3B82F6' : '#22C55E';
  const dimAccent = active === 0 ? '#7A2508' : active === 1 ? '#1A3A6E' : '#0E5A2A';

  const ctaAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Dynamic top gradient */}
      <LinearGradient
        colors={
          active === 0 ? ['#2A0900', '#150400', '#0A0A0A'] :
          active === 1 ? ['#001B3E', '#000D1F', '#0A0A0A'] :
          ['#003A18', '#001A0A', '#0A0A0A']
        }
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 16 }]}
          onPress={skip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipTxt}>Skip</Text>
          <Ionicons name="chevron-forward" size={12} color="#555" />
        </TouchableOpacity>
      )}

      {/* Step indicator top-left */}
      <View style={[styles.stepWrap, { top: topPad + 18 }]}>
        <Text style={[styles.stepNum, { color: accent }]}>
          {String(active + 1).padStart(2, '0')}
        </Text>
        <Text style={styles.stepOf}>/ 03</Text>
      </View>

      {/* Slides */}
      <AnimatedFlatList
        ref={flatRef as any}
        data={[0, 1, 2]}
        keyExtractor={i => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        renderItem={({ index }) => {
          if (index === 0) return (
            <Slide0 scrollX={scrollX} topPad={topPad} />
          );
          if (index === 1) return (
            <Slide1 scrollX={scrollX} topPad={topPad} />
          );
          return (
            <Slide2 scrollX={scrollX} topPad={topPad} />
          );
        }}
      />

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: bottomPad + 20 }]}>
        {/* Segment progress */}
        <View style={styles.segRow}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.seg,
                {
                  flex: i === active ? 2.2 : 1,
                  height: i === active ? 4 : 3,
                  backgroundColor:
                    i < active ? accent + '80' :
                    i === active ? accent : '#252525',
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, ctaAnim]}>
          <TouchableOpacity onPress={goNext} activeOpacity={1} style={styles.ctaTouch}>
            <LinearGradient
              colors={[accent, dimAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaTxt}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
              <View style={[styles.ctaIcon, { backgroundColor: '#fff2' }]}>
                <Ionicons
                  name={isLast ? 'flash' : 'arrow-forward'}
                  size={16}
                  color="#fff"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>
          {isLast
            ? 'By continuing you agree to our Terms & Privacy Policy'
            : `${active + 1} of 3`}
        </Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 0 — "Enter the Arena"
   Theme: Tournament brackets, rank podium, competitor count chips
═══════════════════════════════════════════════════════════════════════════ */
function Slide0({
  scrollX, topPad,
}: { scrollX: Animated.SharedValue<number>; topPad: number }) {
  const fadeUp = useAnimatedStyle(() => {
    const op = interpolate(scrollX.value, [0, width], [1, 0], Extrapolation.CLAMP);
    const ty = interpolate(scrollX.value, [0, width], [0, 30], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ translateY: ty }] };
  });

  return (
    <View style={[S0.slide, { width, paddingTop: topPad + 72 }]}>
      {/* Trophy visual */}
      <Animated.View style={[S0.iconBlock, fadeUp]}>
        {/* Outer glow ring */}
        <View style={S0.outerRing}>
          <View style={S0.midRing}>
            <LinearGradient
              colors={['#FE4C1130', '#FE4C1108']}
              style={S0.innerGrad}
            >
              <View style={S0.iconBox}>
                <Ionicons name="trophy" size={52} color="#FE4C11" />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Rank badges flanking the trophy */}
        <View style={S0.ranks}>
          <View style={[S0.rankBadge, { backgroundColor: '#C0C0C015', borderColor: '#C0C0C040' }]}>
            <Text style={[S0.rankIcon]}>🥈</Text>
            <Text style={[S0.rankLbl, { color: '#C0C0C0' }]}>2nd</Text>
          </View>
          <View style={[S0.rankBadge, S0.rankCenter, { backgroundColor: '#FFD70018', borderColor: '#FFD70060' }]}>
            <Text style={S0.rankIcon}>🏆</Text>
            <Text style={[S0.rankLbl, { color: '#FFD700' }]}>1st</Text>
          </View>
          <View style={[S0.rankBadge, { backgroundColor: '#CD7F3215', borderColor: '#CD7F3240' }]}>
            <Text style={S0.rankIcon}>🥉</Text>
            <Text style={[S0.rankLbl, { color: '#CD7F32' }]}>3rd</Text>
          </View>
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[S0.textBlock, fadeUp]}>
        <View style={S0.chip}>
          <View style={[S0.chipDot, { backgroundColor: '#FE4C11' }]} />
          <Text style={[S0.chipTxt, { color: '#FE4C11' }]}>TOURNAMENTS</Text>
        </View>

        <Text style={S0.title}>
          Enter the{'\n'}
          <Text style={{ color: '#FE4C11' }}>Arena</Text>
        </Text>

        <Text style={S0.body}>
          Join elite eSports tournaments and battle the best players. Every match is your chance to prove yourself.
        </Text>

        {/* Stat row */}
        <View style={S0.statRow}>
          <View style={S0.statBox}>
            <Ionicons name="people-outline" size={14} color="#FE4C11" />
            <Text style={S0.statVal}>2,400+</Text>
            <Text style={S0.statLbl}>Players</Text>
          </View>
          <View style={S0.statDivider} />
          <View style={S0.statBox}>
            <Ionicons name="calendar-outline" size={14} color="#FE4C11" />
            <Text style={S0.statVal}>Daily</Text>
            <Text style={S0.statLbl}>Tournaments</Text>
          </View>
          <View style={S0.statDivider} />
          <View style={S0.statBox}>
            <Ionicons name="game-controller-outline" size={14} color="#FE4C11" />
            <Text style={S0.statVal}>5+</Text>
            <Text style={S0.statLbl}>Games</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const S0 = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 230,
    gap: 0,
  },
  iconBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: '#FE4C1120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  midRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: '#FE4C1138',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FE4C1118',
    borderWidth: 1.5,
    borderColor: '#FE4C1145',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ranks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  rankCenter: {
    paddingVertical: 12,
    borderRadius: 14,
  },
  rankIcon: {
    fontSize: 20,
  },
  rankLbl: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FE4C1135',
    backgroundColor: '#FE4C1112',
    marginBottom: 16,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  chipTxt: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 14,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 0,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statVal: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#444',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#222',
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 1 — "Track Live Battles"
   Theme: Live match ticker, mini leaderboard rows, real-time pulse
═══════════════════════════════════════════════════════════════════════════ */
function Slide1({
  scrollX, topPad,
}: { scrollX: Animated.SharedValue<number>; topPad: number }) {
  const fadeUp = useAnimatedStyle(() => {
    const op = interpolate(scrollX.value, [0, width, width * 2], [0, 1, 0], Extrapolation.CLAMP);
    const ty = interpolate(scrollX.value, [0, width, width * 2], [30, 0, 30], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ translateY: ty }] };
  });

  const LEADERS = [
    { name: 'ArjunX99', pts: 1840, kills: 42, rank: 1 },
    { name: 'ShadowBlaze', pts: 1720, kills: 38, rank: 2 },
    { name: 'NightRaider', pts: 1650, kills: 35, rank: 3 },
  ];

  return (
    <View style={[S1.slide, { width, paddingTop: topPad + 72 }]}>
      {/* Icon block with LIVE badge */}
      <Animated.View style={[S1.iconBlock, fadeUp]}>
        <View style={S1.liveWrapper}>
          {/* Pulse ring */}
          <View style={S1.pulseRingOuter}>
            <View style={S1.pulseRingInner}>
              <LinearGradient
                colors={['#3B82F630', '#3B82F608']}
                style={S1.innerGrad}
              >
                <View style={S1.iconBox}>
                  <Ionicons name="pulse" size={48} color="#3B82F6" />
                </View>
              </LinearGradient>
            </View>
          </View>
          {/* LIVE badge */}
          <View style={S1.liveBadge}>
            <View style={S1.liveDot} />
            <Text style={S1.liveTxt}>LIVE</Text>
          </View>
        </View>
      </Animated.View>

      {/* Text + leaderboard */}
      <Animated.View style={[S1.textBlock, fadeUp]}>
        <View style={S1.chip}>
          <View style={[S1.chipDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[S1.chipTxt, { color: '#3B82F6' }]}>LIVE MATCHES</Text>
        </View>

        <Text style={S1.title}>
          Track{' '}
          <Text style={{ color: '#3B82F6' }}>Live</Text>
          {'\n'}Battles
        </Text>

        <Text style={S1.body}>
          Follow matches in real time. Watch leaderboards shift as the competition heats up — stay in the action.
        </Text>

        {/* Mini leaderboard */}
        <View style={S1.leaderCard}>
          <View style={S1.leaderHeader}>
            <Text style={S1.leaderTitle}>Live Leaderboard</Text>
            <View style={S1.liveTagSmall}>
              <View style={S1.liveTagDot} />
              <Text style={S1.liveTagTxt}>LIVE</Text>
            </View>
          </View>
          {LEADERS.map((p) => (
            <View key={p.rank} style={S1.leaderRow}>
              <Text style={[S1.leaderRank, p.rank === 1 && { color: '#FFD700' }]}>
                #{p.rank}
              </Text>
              <View style={[S1.leaderAvatar, {
                backgroundColor: p.rank === 1 ? '#FFD70018' : p.rank === 2 ? '#C0C0C012' : '#CD7F3212',
                borderColor: p.rank === 1 ? '#FFD70040' : p.rank === 2 ? '#C0C0C030' : '#CD7F3230',
              }]}>
                <Ionicons name="person" size={11} color={p.rank === 1 ? '#FFD700' : p.rank === 2 ? '#C0C0C0' : '#CD7F32'} />
              </View>
              <Text style={S1.leaderName}>{p.name}</Text>
              <View style={{ flex: 1 }} />
              <View style={S1.killBadge}>
                <Ionicons name="flame" size={9} color="#FE4C11" />
                <Text style={S1.killTxt}>{p.kills}</Text>
              </View>
              <Text style={S1.leaderPts}>{p.pts.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const S1 = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 230,
    gap: 0,
  },
  iconBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  liveWrapper: {
    alignItems: 'center',
  },
  pulseRingOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: '#3B82F618',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRingInner: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
    borderColor: '#3B82F635',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 82,
    height: 82,
    borderRadius: 22,
    backgroundColor: '#3B82F618',
    borderWidth: 1.5,
    borderColor: '#3B82F640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF000018',
    borderWidth: 1,
    borderColor: '#FF000040',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF3B3B',
  },
  liveTxt: {
    color: '#FF3B3B',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F635',
    backgroundColor: '#3B82F612',
    marginBottom: 14,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  chipTxt: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 20,
  },
  leaderCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    gap: 8,
  },
  leaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leaderTitle: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  liveTagSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B3B18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B3B35',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveTagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FF3B3B',
  },
  liveTagTxt: {
    color: '#FF3B3B',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  leaderRank: {
    width: 22,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#444',
  },
  leaderAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#CCC',
    flex: 1,
  },
  killBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FE4C1115',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  killTxt: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#FE4C11',
  },
  leaderPts: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#3B82F6',
    minWidth: 36,
    textAlign: 'right',
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 2 — "Win Real Rewards"
   Theme: Prize pool display, rupee breakdown, wallet graphic
═══════════════════════════════════════════════════════════════════════════ */
function Slide2({
  scrollX, topPad,
}: { scrollX: Animated.SharedValue<number>; topPad: number }) {
  const fadeUp = useAnimatedStyle(() => {
    const op = interpolate(scrollX.value, [width, width * 2], [0, 1], Extrapolation.CLAMP);
    const ty = interpolate(scrollX.value, [width, width * 2], [30, 0], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ translateY: ty }] };
  });

  const PRIZES = [
    { label: '1st Place', amount: '₹5,000', color: '#FFD700', icon: '🥇' },
    { label: '2nd Place', amount: '₹3,000', color: '#C0C0C0', icon: '🥈' },
    { label: '3rd Place', amount: '₹2,000', color: '#CD7F32', icon: '🥉' },
  ];

  return (
    <View style={[S2.slide, { width, paddingTop: topPad + 72 }]}>
      {/* Wallet icon + prize amount */}
      <Animated.View style={[S2.iconBlock, fadeUp]}>
        <View style={S2.prizeRing}>
          <View style={S2.prizeRingInner}>
            <LinearGradient
              colors={['#22C55E30', '#22C55E08']}
              style={S2.innerGrad}
            >
              <View style={S2.iconBox}>
                <Ionicons name="wallet" size={48} color="#22C55E" />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Prize pool pill */}
        <View style={S2.poolPill}>
          <Text style={S2.poolLabel}>TOTAL PRIZE POOL</Text>
          <Text style={S2.poolAmount}>₹10,000</Text>
          <Text style={S2.poolSub}>per tournament</Text>
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[S2.textBlock, fadeUp]}>
        <View style={S2.chip}>
          <View style={[S2.chipDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[S2.chipTxt, { color: '#22C55E' }]}>REAL REWARDS</Text>
        </View>

        <Text style={S2.title}>
          Win{' '}
          <Text style={{ color: '#22C55E' }}>Real</Text>
          {'\n'}Rewards
        </Text>

        <Text style={S2.body}>
          Compete for prize pools paid directly to your wallet in Indian Rupees. Every match counts.
        </Text>

        {/* Prize breakdown */}
        <View style={S2.prizeCard}>
          <Text style={S2.prizeCardTitle}>Prize Distribution</Text>
          {PRIZES.map((p) => (
            <View key={p.label} style={S2.prizeRow}>
              <Text style={S2.prizeIcon}>{p.icon}</Text>
              <Text style={S2.prizeName}>{p.label}</Text>
              <View style={{ flex: 1 }} />
              <View style={[S2.prizeAmtBox, { borderColor: p.color + '40', backgroundColor: p.color + '10' }]}>
                <Text style={[S2.prizeAmt, { color: p.color }]}>{p.amount}</Text>
              </View>
            </View>
          ))}
          <View style={S2.prizeFooter}>
            <Ionicons name="flash" size={11} color="#22C55E" />
            <Text style={S2.prizeFooterTxt}>Instant wallet credit after match ends</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const S2 = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 230,
    gap: 0,
  },
  iconBlock: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },
  prizeRing: {
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 1,
    borderColor: '#22C55E18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeRingInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: '#22C55E35',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#22C55E18',
    borderWidth: 1.5,
    borderColor: '#22C55E40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolPill: {
    alignItems: 'center',
    backgroundColor: '#22C55E12',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22C55E30',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 2,
  },
  poolLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#22C55E',
    letterSpacing: 2,
  },
  poolAmount: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  poolSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#444',
    letterSpacing: 0.3,
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E35',
    backgroundColor: '#22C55E12',
    marginBottom: 14,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  chipTxt: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 20,
  },
  prizeCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    gap: 0,
  },
  prizeCardTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#555',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 10,
  },
  prizeIcon: {
    fontSize: 18,
  },
  prizeName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#888',
  },
  prizeAmtBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  prizeAmt: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  prizeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  prizeFooterTxt: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#3A3A3A',
  },
});

/* ─── Shared bottom styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  skipTxt: {
    color: '#555',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  stepWrap: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  stepNum: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  stepOf: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#2A2A2A',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  segRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    alignItems: 'center',
  },
  seg: {
    borderRadius: 4,
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaTouch: {
    width: '100%',
  },
  ctaGrad: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaTxt: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  ctaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: '#2E2E2E',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
