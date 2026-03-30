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
  onBack: () => void;
}

const RANKS = [
  { rank: '1', name: 'ProSniper_X', kills: 18, pts: 210, color: '#F59E0B' },
  { rank: '2', name: 'StormRider', kills: 14, pts: 175, color: '#9CA3AF' },
  { rank: '3', name: 'EliteGhost', kills: 12, pts: 145, color: '#CD7C3D' },
];

export function Win({ onNext, onBack }: Props) {
  const scaleNext = useSharedValue(1);
  const scaleBack = useSharedValue(1);

  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleNext.value }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleBack.value }],
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBack();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F0A00', '#080500', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── Illustration Area ─── */}
      <View style={[styles.illustration, { height: ILLUSTRATION_H }]}>
        {/* Glow ring behind trophy */}
        <View style={styles.glowRing} />

        {/* Trophy */}
        <LinearGradient
          colors={['#F59E0B22', '#F59E0B06']}
          style={styles.trophyCircle}
        >
          <Ionicons name="trophy" size={68} color="#F59E0B" />
        </LinearGradient>

        {/* Rank cards */}
        <View style={styles.rankList}>
          {RANKS.map((r) => (
            <View key={r.rank} style={styles.rankRow}>
              <View style={[styles.rankNumBox, { borderColor: r.color + '60' }]}>
                <Text style={[styles.rankNum, { color: r.color }]}>#{r.rank}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{r.name}</Text>
                <Text style={styles.rankSub}>{r.kills} kills · {r.pts} pts</Text>
              </View>
              <View style={styles.rankPts}>
                <Text style={[styles.rankPtsVal, { color: r.color }]}>
                  ₹{r.pts * 10}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Crown chip */}
        <View style={styles.crownChip}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.crownTxt}>TOP EARNER THIS WEEK</Text>
        </View>
      </View>

      {/* ─── Text Block ─── */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>DOMINATE{'\n'}THE RANKS</Text>
        <Text style={styles.subtext}>
          Rise to the top and become an Elite Champion.
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

        <Animated.View style={[styles.nextBtnWrap, nextStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => { scaleNext.value = withTiming(0.96, { duration: 100 }); }}
            onPressOut={() => { scaleNext.value = withTiming(1, { duration: 120 }); }}
            style={styles.pressable}
          >
            <LinearGradient
              colors={['#50C878', '#2E9E52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextGrad}
            >
              <Text style={styles.nextTxt}>NEXT</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
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
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#F59E0B08',
    borderWidth: 1,
    borderColor: '#F59E0B15',
  },

  trophyCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    marginBottom: 20,
  },

  rankList: {
    width: width - 48,
    gap: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0C08',
    borderWidth: 1,
    borderColor: '#1E1A10',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  rankNumBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#120F06',
  },
  rankNum: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  rankInfo: { flex: 1 },
  rankName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rankSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#555',
  },
  rankPtsVal: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },

  crownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    backgroundColor: '#130F03',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  crownTxt: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#F59E0B',
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
  nextBtnWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  pressable: { borderRadius: 16, overflow: 'hidden' },
  nextGrad: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
  },
  nextTxt: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 1.5,
  },
});
