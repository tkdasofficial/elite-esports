import { useRef, useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Linking,
} from 'react-native';
import { useBannerStore } from '@/src/store/bannerStore';
import { Colors } from '@/src/theme/colors';
import { Banner } from '@/src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 160;

export function BannerCarousel() {
  const banners = useBannerStore(s => s.banners).filter(b => b.isActive);
  const ref = useRef<FlatList<Banner>>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % banners.length;
        try { ref.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const handlePress = (banner: Banner) => {
    if (banner.link) Linking.openURL(banner.link).catch(() => {});
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={ref}
        data={banners}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
          setCurrent(Math.min(idx, banners.length - 1));
        }}
        getItemLayout={(_, index) => ({
          length: CARD_W + 12,
          offset: (CARD_W + 12) * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => handlePress(item)}
            style={styles.card}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.imageFallback]} />
            )}
            <View style={styles.overlay}>
              <View style={styles.textBlock}>
                {!!item.title && (
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                )}
                {!!item.description && (
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                )}
                {!!item.buttonText && (
                  <View style={styles.btn}>
                    <Text style={styles.btnText}>{item.buttonText}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8, marginHorizontal: -16 },
  listContent: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.appCard,
  },
  imageFallback: {
    backgroundColor: `${Colors.brandPrimary}20`,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  textBlock: { gap: 4 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.brandPrimary,
    borderRadius: 20,
  },
  btnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.appElevated },
  dotActive: { width: 16, backgroundColor: Colors.brandPrimary },
});
