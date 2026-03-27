import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { STATUS_CONFIG } from '@/utils/types';
import { useAuth } from '@/store/AuthContext';
import { useMatchDetail } from '@/features/match/hooks/useMatchDetail';
import { RoomDetails } from '@/features/match/components/RoomDetails';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { match, loading, hasJoined, joining, joinMatch } = useMatchDetail(id, user?.id);

  const handleJoin = async () => {
    const { error } = await joinMatch();
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Joined!', 'You have successfully joined the match.');
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!match) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.text.muted} />
        <Text style={styles.emptyTitle}>Match Not Found</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[match.status];
  const isFull = match.players_joined >= match.max_players;
  const canJoin = match.status === 'upcoming' && !isFull && !hasJoined;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          {match.banner_url ? (
            <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#2A0900', '#0A0A0A']} style={styles.banner}>
              <Ionicons name="game-controller-outline" size={64} color={Colors.primary} />
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', Colors.background.dark]} style={styles.bannerOverlay} />
          <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
            {match.status === 'ongoing' && <View style={styles.liveDot} />}
            <Text style={styles.statusText}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.gameTag}>{match.game}</Text>
          <Text style={styles.title}>{match.title}</Text>
          {match.description && <Text style={styles.desc}>{match.description}</Text>}

          <View style={styles.statsGrid}>
            {[
              { label: 'Entry Fee', value: `₹${match.entry_fee}`, icon: 'ticket-outline', highlight: false },
              { label: 'Prize Pool', value: `₹${match.prize_pool}`, icon: 'trophy-outline', highlight: true },
              { label: 'Players', value: `${match.players_joined}/${match.max_players}`, icon: 'people-outline', highlight: false },
              { label: 'Starts At', value: new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: 'time-outline', highlight: false },
            ].map(({ label, value, icon, highlight }) => (
              <View key={label} style={styles.statCard}>
                <Ionicons name={icon as any} size={18} color={highlight ? Colors.primary : Colors.text.secondary} />
                <Text style={[styles.statValue, highlight && { color: Colors.primary }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.slotSection}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>Slots</Text>
              <Text style={styles.slotCount}>{match.players_joined} / {match.max_players}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(match.players_joined / match.max_players) * 100}%` as any }]} />
            </View>
          </View>

          {match.status === 'ongoing' && hasJoined && (
            <RoomDetails roomId={match.room_id} roomPassword={match.room_password} />
          )}

          {match.status === 'ongoing' && !hasJoined && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.status.warning} />
              <Text style={styles.infoText}>Join the match to see room credentials</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {canJoin && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={[styles.joinBtn, joining && styles.disabled]} onPress={handleJoin} disabled={joining} activeOpacity={0.85}>
            {joining ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.joinBtnText}>Join Match — ₹{match.entry_fee}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasJoined && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
            <Text style={styles.joinedText}>You've joined this match</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: {},
  bannerContainer: { position: 'relative' },
  banner: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  statusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  content: { padding: 20 },
  gameTag: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 10, lineHeight: 32 },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 22, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.background.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border.default },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  slotSection: { marginBottom: 20 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  slotTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  slotCount: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  progressTrack: { height: 6, backgroundColor: Colors.background.elevated, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  infoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.status.warning, flex: 1 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.background.dark, borderTopWidth: 1, borderTopColor: Colors.border.default },
  joinBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  disabled: { opacity: 0.6 },
  joinBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  joinedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 14, height: 54, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  joinedText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.status.success },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
});
