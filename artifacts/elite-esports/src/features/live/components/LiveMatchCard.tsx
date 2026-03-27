import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';
import { Match } from '@/utils/types';

interface Props {
  match: Match;
}

export function LiveMatchCard({ match }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.bannerContainer}>
        {match.banner_url ? (
          <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1A0500', '#0A0A0A']} style={styles.banner}>
            <Ionicons name="game-controller-outline" size={44} color={Colors.primary} />
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.body}>
        <Text style={styles.gameTag}>{match.game}</Text>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={14} color={Colors.text.secondary} />
            <Text style={styles.infoText}>{match.players_joined}/{match.max_players}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="trophy-outline" size={14} color={Colors.primary} />
            <Text style={[styles.infoText, { color: Colors.primary }]}>₹{match.prize_pool}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.watchBtn}
          onPress={() => match.stream_url && Linking.openURL(match.stream_url)}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.watchBtnText}>Watch Live</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.background.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  bannerContainer: { position: 'relative' },
  banner: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
  bannerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, justifyContent: 'flex-end', padding: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.9)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  body: { padding: 16 },
  gameTag: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  watchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.status.error, borderRadius: 10, height: 44 },
  watchBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
