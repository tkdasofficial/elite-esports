import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function PlayAndWin({ onNext, onBack }: Props) {
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  const REWARDS = [
    { icon: 'trophy' as const, label: 'Daily Tournaments', val: '50+', color: '#FFD700' },
    { icon: 'wallet' as const, label: 'Prize Pool', val: '₹1L+', color: '#22C55E' },
    { icon: 'flame' as const, label: 'Active Players', val: '10K+', color: '#EE3D2D' },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#001A00', '#000D00', '#080808']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Icon trio — trophy flanked by wallet + reward */}
      <View style={styles.iconArea}>
        {/* Side icons */}
        <View style={[styles.sideIcon, { left: 20 }]}>
          <LinearGradient colors={['#FFD70020', '#FFD70005']} style={styles.sideGrad}>
            <Ionicons name="trophy" size={26} color="#FFD700" />
          </LinearGradient>
          <Text style={[styles.sideLabel, { color: '#FFD70099' }]}>WIN</Text>
        </View>

        {/* Centre wallet */}
        <View style={styles.centreWrap}>
          <View style={styles.centreRingOut}>
            <View style={styles.centreRingMid}>
              <LinearGradient colors={['#22C55E25', '#22C55E06']} style={styles.centreGrad}>
                <View style={styles.centreBox}>
                  <Ionicons name="wallet" size={52} color="#22C55E" />
                </View>
              </LinearGradient>
            </View>
          </View>
          {/* Floating ₹ pill */}
          <View style={styles.floatPill}>
            <Text style={styles.floatPillTxt}>₹ REAL MONEY</Text>
          </View>
        </View>

        <View style={[styles.sideIcon, { right: 20 }]}>
          <LinearGradient colors={['#EE3D2D20', '#EE3D2D05']} style={styles.sideGrad}>
            <Ionicons name="flash" size={26} color="#EE3D2D" />
          </LinearGradient>
          <Text style={[styles.sideLabel, { color: '#EE3D2D99' }]}>EARN</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsCard}>
        {REWARDS.map((r, i) => (
          <React.Fragment key={r.label}>
            {i > 0 && <View style={styles.statDiv} />}
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: r.color + '18', borderColor: r.color + '35' }]}>
                <Ionicons name={r.icon} size={14} color={r.color} />
              </View>
              <Text style={[styles.statVal, { color: r.color }]}>{r.val}</Text>
              <Text style={styles.statLbl}>{r.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <View style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.chipTxt, { color: '#22C55E' }]}>REWARDS</Text>
        </View>
        <Text style={styles.title}>Compete,{'\n'}Dominate, <Text style={{ color: '#22C55E' }}>Earn</Text></Text>
        <Text style={styles.sub}>Join daily tournaments and win real rewards in your wallet.</Text>
      </View>

      {/* CTA row */}
      <View style={styles.ctaRow}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="arrow-back" size={20} color="#666" />
        </Pressable>

        <Pressable onPress={handleNext} style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.88 }]}>
          <LinearGradient
            colors={['#22C55E', '#0E5A2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextGrad}
          >
            <Text style={styles.nextTxt}>Next</Text>
            <View style={styles.nextIcon}>
              <Ionicons name="arrow-forward" size={17} color="#22C55E" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  sideIcon: {
    position: 'absolute',
    alignItems: 'center',
    gap: 6,
    top: 40,
  },
  sideGrad: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sideLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },

  centreWrap: {
    alignItems: 'center',
  },
  centreRingOut: {
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 1,
    borderColor: '#22C55E18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  centreRingMid: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
    borderColor: '#22C55E32',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centreGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreBox: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: '#22C55E16',
    borderWidth: 1.5,
    borderColor: '#22C55E40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatPill: {
    backgroundColor: '#22C55E18',
    borderWidth: 1,
    borderColor: '#22C55E35',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  floatPillTxt: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#22C55E',
    letterSpacing: 1.5,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginHorizontal: 28,
    marginBottom: 28,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statLbl: { fontSize: 9, fontFamily: 'Inter_400Regular', color: '#444', textAlign: 'center' },
  statDiv: { width: 1, alignSelf: 'stretch', backgroundColor: '#1A1A1A' },

  textBlock: { alignItems: 'center', marginBottom: 40, paddingHorizontal: 28 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E35',
    backgroundColor: '#22C55E10',
    marginBottom: 14,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 2 },

  title: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 40,
    marginBottom: 12,
  },
  sub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    width: '100%',
  },
  backBtn: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextGrad: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.3 },
  nextIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
