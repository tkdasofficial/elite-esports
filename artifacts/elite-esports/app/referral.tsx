import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(userId: string): string {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash) ^ userId.charCodeAt(i);
    hash = hash >>> 0;
  }
  let code = '';
  let n = hash;
  for (let i = 0; i < 8; i++) {
    code += CHARSET[n % CHARSET.length];
    n = Math.floor(n / CHARSET.length);
    if (n === 0) n = hash ^ (i + 1) * 2654435761;
    n = n >>> 0;
  }
  return code;
}

interface ReferralTx {
  id: string;
  amount: number;
  created_at: string;
  reference_id: string;
}

export default function ReferralScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ReferralTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  const referralCode = user?.id ? generateReferralCode(user.id) : '--------';

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('id, amount, created_at, reference_id')
        .eq('user_id', user.id)
        .like('reference_id', 'referral:%')
        .order('created_at', { ascending: false });

      if (data) {
        setHistory(data as ReferralTx[]);
        const total = data.reduce((s, r) => s + Number(r.amount), 0);
        setTotalEarned(total);
        setReferralCount(data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Elite eSports and compete in tournaments!\nUse my referral code: ${referralCode}\n\nDownload now and win real cash prizes!`,
        title: 'Join Elite eSports',
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Referral Program" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={30} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Invite Friends & Earn</Text>
          <Text style={styles.heroSub}>
            Share your code — when your friend joins and plays their first match, you both earn wallet rewards!
          </Text>
        </View>

        {/* Referral Code Box */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            {referralCode.split('').map((char, i) => (
              <View key={i} style={[styles.charBox, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
                <Text style={[styles.charText, { color: colors.primary }]}>{char}</Text>
              </View>
            ))}
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? colors.status.success : colors.text.secondary} />
              <Text style={[styles.actionBtnText, { color: copied ? colors.status.success : colors.text.secondary }]}>
                {copied ? 'Copied!' : 'Copy Code'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider, { borderColor: colors.border.default }]}>
            <Ionicons name="wallet" size={20} color="#22C55E" style={{ marginBottom: 8 }} />
            <Text style={[styles.statValue, { color: '#22C55E' }]}>₹{totalEarned.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { step: '1', icon: 'share-social-outline' as const, title: 'Share Code', text: 'Send your 8-character code to friends' },
            { step: '2', icon: 'person-add-outline' as const, title: 'Friend Joins', text: 'They sign up using your referral code' },
            { step: '3', icon: 'trophy-outline' as const, title: 'Both Earn', text: 'You both receive a bonus in your wallets' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{item.step}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Referral History */}
        <Text style={styles.histTitle}>Referral History</Text>
        {loading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map(i => <SkeletonBar key={i} width="100%" height={64} radius={14} />)}
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.emptySub}>Share your code to start earning!</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {history.map(item => (
              <View key={item.id} style={styles.histRow}>
                <View style={styles.histIcon}>
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histLabel}>Referral Bonus</Text>
                  <Text style={styles.histDate}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.histAmountWrap}>
                  <Text style={styles.histAmount}>+₹{Number(item.amount).toFixed(0)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 16, gap: 14 },

    heroCard: {
      backgroundColor: colors.background.card,
      borderRadius: 20, padding: 24,
      alignItems: 'center',
      borderWidth: 1, borderColor: colors.border.default,
    },
    heroIcon: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
    },
    heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 8, textAlign: 'center' },
    heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 21 },

    codeCard: {
      backgroundColor: colors.background.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: colors.border.default, alignItems: 'center',
    },
    codeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2 },
    codeBox: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    charBox: {
      width: 34, height: 42, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
    },
    charText: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 0 },
    codeActions: { flexDirection: 'row', gap: 10, width: '100%' },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    },
    actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.background.card,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border.default,
      overflow: 'hidden',
    },
    statCard: {
      flex: 1, padding: 20, alignItems: 'center',
    },
    statDivider: {
      borderLeftWidth: 1,
    },
    statValue: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 4 },
    statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    sectionCard: {
      backgroundColor: colors.background.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: colors.border.default,
    },
    sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 16 },
    stepRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.subtle,
    },
    stepIconWrap: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.primary + '15',
      alignItems: 'center', justifyContent: 'center',
    },
    stepTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 2 },
    stepText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    stepBadge: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    stepBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.text.muted },

    histTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    histRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border.subtle,
    },
    histIcon: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
    },
    histLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 3 },
    histDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    histAmountWrap: {
      backgroundColor: '#22C55E18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    },
    histAmount: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#22C55E' },

    emptyWrap: { alignItems: 'center', paddingVertical: 36, gap: 8 },
    emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
  });
}
