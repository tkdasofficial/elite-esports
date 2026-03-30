import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

function ShimmerBar({ width: w, height: h, radius = 8, style }: {
  width: number | string;
  height: number;
  radius?: number;
  style?: any;
}) {
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (shimmer.value * (typeof w === 'number' ? w : CARD_WIDTH)) }],
  }));

  return (
    <View
      style={[
        styles.bar,
        { width: w as any, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', '#FFFFFF08', '#FFFFFF14', '#FFFFFF08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      {/* Banner skeleton */}
      <ShimmerBar width="100%" height={CARD_WIDTH * (9 / 16)} radius={0} />

      <View style={styles.body}>
        <ShimmerBar width={60} height={10} radius={6} style={{ marginBottom: 10 }} />
        <ShimmerBar width="75%" height={18} radius={8} style={{ marginBottom: 20 }} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <ShimmerBar width={56} height={32} radius={8} />
          <ShimmerBar width={56} height={32} radius={8} />
          <ShimmerBar width={56} height={32} radius={8} />
        </View>

        <ShimmerBar width="100%" height={4} radius={2} style={{ marginBottom: 16 }} />
        <ShimmerBar width="100%" height={48} radius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  body: {
    padding: 16,
  },
  bar: {
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
