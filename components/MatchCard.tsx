import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Match } from '@/src/types';
import { Colors } from '@/src/theme/colors';

const statusConfig = {
  live:      { label: '● LIVE',   color: Colors.brandLive,    bg: 'rgba(255,59,48,0.15)' },
  upcoming:  { label: 'UPCOMING', color: Colors.brandWarning, bg: 'rgba(255,159,10,0.12)' },
  completed: { label: 'ENDED',    color: Colors.textMuted,    bg: Colors.appElevated },
};

interface Props { match: Match; }

export function MatchCard({ match }: Props) {
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;
  const fillPct = Math.min((match.slots_filled / match.slots_total) * 100, 100);
  const cfg = statusConfig[match.status];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => { scale.value = withTiming(0.975, { duration: 80 }); };
  const onPressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/match/${match.match_id}`)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, animStyle]}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: match.banner_image }}
            style={styles.banner}
            resizeMode="cover"
          />
          <View style={styles.overlay} />

          <View style={styles.gameBadge}>
            <Text style={styles.gameBadgeText}>{match.game_name}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <View style={styles.titleOverlay}>
            <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
            <Text style={styles.matchMode}>{match.mode}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="trophy" size={13} color={Colors.brandSuccess} />
              <Text style={[styles.metaText, { color: Colors.brandSuccess }]}>{match.prize}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={13} color={Colors.textMuted} />
              <Text style={styles.metaText}>{match.start_time}</Text>
            </View>
            <View style={[styles.metaItem, styles.metaRight]}>
              <Feather name="users" size={12} color={Colors.textMuted} />
              <Text style={[styles.metaText, isFull && { color: Colors.brandLive }]}>
                {isFull ? 'Full' : `${slotsLeft} left`}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${fillPct}%` as any,
                    backgroundColor: isFull ? Colors.brandLive : fillPct > 75 ? Colors.brandWarning : Colors.brandPrimary,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Entry {match.entry_fee}</Text>
              <Text style={styles.progressLabel}>{match.slots_filled}/{match.slots_total} joined</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push(`/match/${match.match_id}`)}
          >
            <Text style={styles.ctaText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.brandPrimaryLight} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: Colors.appCard,
  },
  bannerContainer: { aspectRatio: 16 / 8, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  gameBadge: {
    position: 'absolute', top: 10, left: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  gameBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.white },
  statusBadge: {
    position: 'absolute', top: 10, right: 12,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  titleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  matchTitle: { fontSize: 16, fontWeight: '600', color: Colors.white, letterSpacing: -0.3 },
  matchMode: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 2 },
  body: { padding: 12, gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaRight: { marginLeft: 'auto' },
  metaText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  progressContainer: { gap: 6 },
  progressBg: { height: 4, backgroundColor: Colors.appElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: Colors.textMuted },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    backgroundColor: 'rgba(255,107,43,0.12)',
    borderRadius: 12,
  },
  ctaText: { fontSize: 14, fontWeight: '600', color: Colors.brandPrimaryLight },
});
