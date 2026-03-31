import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';

interface Props {
  width:   number | `${number}%`;
  height:  number;
  radius?: number;
  style?:  ViewStyle;
}

export function SkeletonBar({ width, height, radius = 8, style }: Props) {
  const { isDark } = useTheme();
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          shimmer.value * (typeof width === 'number' ? width : 300),
      },
    ],
  }));

  const bgColor = isDark ? '#1C1C1C' : '#E0E0E0';
  const shimmerLight = isDark
    ? ['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)', 'transparent']
    : ['transparent', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)', 'transparent'];

  return (
    <View
      style={[
        { backgroundColor: bgColor, borderRadius: radius, overflow: 'hidden' },
        { width: width as any, height },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={shimmerLight as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
