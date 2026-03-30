import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Props {
  onGetStarted: () => void;
  onBack: () => void;
}

// Fake player grid data
const PLAYERS = [
  { initials: 'AJ', color: '#EE3D2D' },
  { initials: 'SK', color: '#3B82F6' },
  { initials: 'RV', color: '#22C55E' },
  { initials: 'MT', color: '#F59E0B' },
  { initials: 'PK', color: '#A855F7' },
  { initials: 'DX', color: '#EE3D2D' },
  { initials: 'NC', color: '#3B82F6' },
  { initials: 'ZR', color: '#22C55E' },
  { initials: 'BV', color: '#F59E0B' },
];

export function JoinElite({ onGetStarted, onBack }: Props) {
  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onGetStarted();
  };
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A0000', '#0D0000', '#080808']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Community grid */}
      <View style={styles.communityArea}>
        {/* Player avatar grid 3×3 */}
        <View style={styles.gridWrap}>
          {PLAYERS.map((p, i) => {
            const isCenter = i === 4;
            return (
              <View
                key={i}
                style={[
                  styles.avatarBox,
                  isCenter && styles.avatarCenter,
                  { borderColor: p.color + (isCenter ? 'AA' : '40') },
                  isCenter && { backgroundColor: p.color + '1A' },
                ]}
              >
                {isCenter ? (
                  <Ionicons name="person" size={26} color={p.color} />
                ) : (
                  <Text style={[styles.avatarTxt, { color: p.color }]}>{p.initials}</Text>
                )}
                {isCenter && (
                  <View style={styles.youTag}>
                    <Text style={styles.youTxt}>YOU</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Online count */}
        <View style={styles.onlinePill}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineTxt}>10,000+ players online right now</Text>
        </View>
      </View>

      {/* Regions / game badges */}
      <View style={styles.badgeRow}>
        {['🇮🇳 India', '🎮 BGMI', '🔥 Free Fire', '⚡ Valorant'].map((b) => (
          <View key={b} style={styles.badge}>
            <Text style={styles.badgeTxt}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <View style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: '#EE3D2D' }]} />
          <Text style={[styles.chipTxt, { color: '#EE3D2D' }]}>JOIN THE ELITE</Text>
        </View>

        <Text style={styles.title}>
          Your <Text style={{ color: '#EE3D2D' }}>Glory</Text>{'\n'}Awaits
        </Text>
        <Text style={styles.sub}>
          Thousands of players are already competing.{'\n'}Are you ready?
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
        >
          <LinearGradient
            colors={['#EE3D2D', '#C02E20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGrad}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.startTxt}>Get Started</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="arrow-back" size={15} color="#444" />
          <Text style={styles.backLinkTxt}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const AVATAR_SIZE = (width - 56 - 16) / 3;

const styles = StyleSheet.create({
  root: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  communityArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: AVATAR_SIZE * 3 + 16,
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCenter: {
    borderWidth: 2,
    position: 'relative',
  },
  avatarTxt: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  youTag: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: '#EE3D2D',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  youTxt: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 1 },

  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#22C55E12',
    borderWidth: 1,
    borderColor: '#22C55E30',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  onlineTxt: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#22C55E' },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 28,
    paddingHorizontal: 28,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
  },
  badgeTxt: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#777' },

  textBlock: { alignItems: 'center', marginBottom: 40, paddingHorizontal: 28 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EE3D2D35',
    backgroundColor: '#EE3D2D10',
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

  ctaArea: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 14,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EE3D2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  startBtnPressed: { opacity: 0.9 },
  startGrad: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startTxt: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.4 },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backLinkTxt: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#444' },
});
