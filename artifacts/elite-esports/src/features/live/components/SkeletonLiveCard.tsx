/**
 * SkeletonLiveCard — shimmer placeholder that mirrors LiveMatchCard layout.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { Colors } from '@/utils/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

export function SkeletonLiveCard() {
  return (
    <View style={styles.card}>
      {/* Banner */}
      <SkeletonBar width={CARD_W} height={BANNER_H} radius={0} />

      {/* Body */}
      <View style={styles.body}>
        {/* Game tag */}
        <SkeletonBar width={64} height={10} radius={5} style={{ marginBottom: 8 }} />
        {/* Title */}
        <SkeletonBar width="78%" height={16} radius={7} style={{ marginBottom: 12 }} />
        {/* Info row */}
        <View style={styles.infoRow}>
          <SkeletonBar width={80} height={14} radius={6} />
          <SkeletonBar width={80} height={14} radius={6} />
        </View>
        {/* Button */}
        <SkeletonBar width="100%" height={44} radius={10} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  body: {
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
