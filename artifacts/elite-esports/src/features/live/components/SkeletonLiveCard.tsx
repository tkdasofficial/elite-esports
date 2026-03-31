import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { useTheme } from '@/store/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

export function SkeletonLiveCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <SkeletonBar width={CARD_W} height={BANNER_H} radius={0} />
      <View style={styles.body}>
        <SkeletonBar width={64} height={10} radius={5} style={{ marginBottom: 8 }} />
        <SkeletonBar width="78%" height={16} radius={7} style={{ marginBottom: 12 }} />
        <View style={styles.infoRow}>
          <SkeletonBar width={80} height={14} radius={6} />
          <SkeletonBar width={80} height={14} radius={6} />
        </View>
        <SkeletonBar width="100%" height={44} radius={10} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    body: { padding: 14 },
    infoRow: { flexDirection: 'row', gap: 12 },
  });
}
