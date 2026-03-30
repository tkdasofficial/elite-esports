import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Play } from '@/features/onboarding/Play';
import { Win } from '@/features/onboarding/Win';
import { Withdraw } from '@/features/onboarding/Withdraw';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');

  const topPad = Platform.OS === 'web' ? Math.max(64, insets.top) : insets.top;
  const botPad = insets.bottom + (Platform.OS === 'web' ? 24 : 0);

  const entering = dir === 'fwd'
    ? FadeInRight.duration(320).springify().damping(24)
    : FadeInLeft.duration(320).springify().damping(24);
  const exiting = dir === 'fwd'
    ? FadeOutLeft.duration(220)
    : FadeOutRight.duration(220);

  const goNext = () => {
    setDir('fwd');
    setStep(s => s + 1);
  };
  const goBack = () => {
    setDir('back');
    setStep(s => s - 1);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>

      {/* ─── Pages ─── */}
      {step === 0 && (
        <Animated.View key="play" entering={entering} exiting={exiting} style={styles.page}>
          <Play onNext={goNext} />
        </Animated.View>
      )}
      {step === 1 && (
        <Animated.View key="win" entering={entering} exiting={exiting} style={styles.page}>
          <Win onNext={goNext} onBack={goBack} />
        </Animated.View>
      )}
      {step === 2 && (
        <Animated.View key="withdraw" entering={entering} exiting={exiting} style={styles.page}>
          <Withdraw onBack={goBack} />
        </Animated.View>
      )}

      {/* ─── Dots Indicator ─── */}
      <View style={styles.dots} pointerEvents="none">
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  page: {
    flex: 1,
  },
  dots: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#50C878',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#2A2A2A',
  },
});
