import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { SkeletonBar } from '@/components/SkeletonBar';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

export function SkeletonCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <SkeletonBar width={CARD_W} height={BANNER_H} radius={0} />
      <View style={styles.strip}>
        <SkeletonBar width="72%" height={15} radius={7} />
        <View style={styles.bottomRow}>
          <SkeletonBar width={90} height={14} radius={6} />
          <SkeletonBar width={88} height={33} radius={8} />
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card, borderRadius: 16,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border.default,
    },
    strip: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 10 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
}
