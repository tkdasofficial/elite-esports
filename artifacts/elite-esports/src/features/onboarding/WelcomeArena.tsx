import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Props {
  onNext: () => void;
}

export function WelcomeArena({ onNext }: Props) {
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  return (
    <View style={styles.root}>
      {/* Background radial glow */}
      <LinearGradient
        colors={['#2A0600', '#110200', '#080808']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top decorative arc */}
      <View style={styles.arcOuter}>
        <View style={styles.arcMid}>
          <View style={styles.arcInner} />
        </View>
      </View>

      {/* Central icon block */}
      <View style={styles.iconArea}>
        {/* Corner decorations */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Shield / arena icon */}
        <LinearGradient
          colors={['#EE3D2D22', '#EE3D2D05']}
          style={styles.shieldGlow}
        >
          <View style={styles.iconHex}>
            <Ionicons name="shield" size={64} color="#EE3D2D" />
          </View>
        </LinearGradient>

        {/* Crossed swords decoration */}
        <View style={styles.swordRow}>
          <View style={[styles.swordBadge, { borderColor: '#EE3D2D40' }]}>
            <Ionicons name="flash" size={16} color="#EE3D2D" />
            <Text style={styles.swordTxt}>PVP</Text>
          </View>
          <View style={styles.swordDivider} />
          <View style={[styles.swordBadge, { borderColor: '#EE3D2D40' }]}>
            <Ionicons name="trophy" size={16} color="#EE3D2D" />
            <Text style={styles.swordTxt}>WIN</Text>
          </View>
        </View>

        {/* Game tags */}
        <View style={styles.tagRow}>
          {['BGMI', 'Free Fire', 'Valorant', 'CoD'].map((g) => (
            <View key={g} style={styles.tag}>
              <Text style={styles.tagTxt}>{g}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrowTxt}>ELITE eSPORTS</Text>
          <View style={styles.eyebrowLine} />
        </View>

        <Text style={styles.title}>Enter the{'\n'}Elite Arena</Text>
        <Text style={styles.sub}>India's most competitive mobile gaming platform.</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable onPress={handleNext} style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}>
          <LinearGradient
            colors={['#EE3D2D', '#C02E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextGrad}
          >
            <Text style={styles.nextTxt}>Next</Text>
            <View style={styles.nextIconWrap}>
              <Ionicons name="arrow-forward" size={18} color="#EE3D2D" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const ARC = width * 1.5;

const styles = StyleSheet.create({
  root: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arcOuter: {
    position: 'absolute',
    top: -ARC * 0.55,
    width: ARC,
    height: ARC,
    borderRadius: ARC / 2,
    borderWidth: 1,
    borderColor: '#EE3D2D0A',
    alignSelf: 'center',
  },
  arcMid: {
    position: 'absolute',
    top: ARC * 0.08,
    left: ARC * 0.08,
    right: ARC * 0.08,
    bottom: ARC * 0.08,
    borderRadius: ARC / 2,
    borderWidth: 1,
    borderColor: '#EE3D2D14',
  },
  arcInner: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderRadius: ARC / 2,
    borderWidth: 1,
    borderColor: '#EE3D2D1E',
  },

  iconArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#EE3D2D55',
  },
  cornerTL: { top: -10, left: -10, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -10, right: -10, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -10, left: -10, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -10, right: -10, borderBottomWidth: 2, borderRightWidth: 2 },

  shieldGlow: {
    width: 170,
    height: 170,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconHex: {
    width: 108,
    height: 108,
    borderRadius: 20,
    backgroundColor: '#EE3D2D14',
    borderWidth: 1.5,
    borderColor: '#EE3D2D45',
    alignItems: 'center',
    justifyContent: 'center',
  },

  swordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  swordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#EE3D2D0C',
  },
  swordTxt: { color: '#EE3D2D', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  swordDivider: { width: 1, height: 20, backgroundColor: '#2A2A2A' },

  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tagTxt: { color: '#666', fontSize: 10, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },

  textBlock: { alignItems: 'center', marginBottom: 48 },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  eyebrowLine: { flex: 1, height: 1, backgroundColor: '#252525', maxWidth: 30 },
  eyebrowTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#444', letterSpacing: 2.5 },

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
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  ctaArea: { width: '100%', paddingHorizontal: 28 },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextBtnPressed: { opacity: 0.88 },
  nextGrad: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.3 },
  nextIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
