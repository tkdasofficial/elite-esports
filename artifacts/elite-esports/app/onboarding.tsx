import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { WelcomeArena } from '@/features/onboarding/WelcomeArena';
import { PlayAndWin } from '@/features/onboarding/PlayAndWin';
import { JoinElite } from '@/features/onboarding/JoinElite';

const { width } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<number>);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollX.value = e.contentOffset.x;
  });

  const goTo = (index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
    setPage(index);
  };

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(auth)/options');
  };

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <AnimatedFlatList
        ref={flatRef as any}
        data={[0, 1, 2]}
        keyExtractor={i => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ index }) => {
          if (index === 0) return (
            <WelcomeArena onNext={() => goTo(1)} />
          );
          if (index === 1) return (
            <PlayAndWin onNext={() => goTo(2)} onBack={() => goTo(0)} />
          );
          return (
            <JoinElite onGetStarted={finish} onBack={() => goTo(1)} />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },
});
