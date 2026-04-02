/**
 * AdBanner — wraps react-native-google-mobile-ads BannerAd
 * Android-only: renders nothing on iOS or web.
 *
 * Usage:
 *   <AdBanner />                        // standard adaptive banner
 *   <AdBanner size="MEDIUM_RECTANGLE" /> // 300×250
 */

import React, { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '@/services/AdService';

type Size = keyof typeof BannerAdSize;

interface Props {
  size?: Size;
  style?: object;
}

export function AdBanner({ size = 'ADAPTIVE_BANNER', style }: Props) {
  const [failed, setFailed] = useState(false);

  // Only show on Android; iOS setup comes later
  if (Platform.OS !== 'android' || failed) return null;

  return (
    <View style={[styles.wrapper, style]}>
      <BannerAd
        unitId={AD_UNITS.BANNER}
        size={BannerAdSize[size]}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'transparent',
  },
});
