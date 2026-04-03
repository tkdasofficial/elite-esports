import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Share,
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

function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  let code = '';
  let n = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    code += chars[n % chars.length];
    n = Math.floor(n / chars.length);
  }
  return 'ELITE-' + code;
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

  const referralCode = user?.id ? generateReferralCode(user.id) : '---';

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
        message: `Join Elite eSports and compete in tournaments! Use my referral code: ${referralCode}\n\nDownload now and win real cash prizes!`,
        title: 'Join Elite eSports',
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Referral Program" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Invite Friends & Earn</Text>
          <Text style={styles.heroSub}>
            Share your code. When your friend joins and plays, you both earn rewards!
          </Text>
        </View>

        {/* Referral Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copied ? colors.status.success : colors.primary}
              />
              <Text style={[styles.copyBtnText, copied && { color: colors.status.success }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={styles.shareBtnText}>Share Referral Code</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statValue}>₹{totalEarned.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { step: '1', text: 'Share your referral code with friends' },
            { step: '2', text: 'They sign up and join their first match' },
            { step: '3', text: 'You both receive a referral bonus in your wallet' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Referral History */}
        <Text style={styles.histTitle}>Referral History</Text>
        {loading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map(i => <SkeletonBar key={i} width="100%" height={60} radius={14} />)}
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
                <Text style={styles.histAmount}>+₹{Number(item.amount).toFixed(0)}</Text>
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
    scroll: { padding: 16 },

    heroCard: {
      backgroundColor: colors.background.card,
      borderRadius: 20, padding: 24,
      alignItems: 'center', marginBottom: 16,
      borderWidth: 1, borderColor: colors.border.default,
    },
    heroIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.primary + '18',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
    },
    heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 8, textAlign: 'center' },
    heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },

    codeCard: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 18,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border.default,
    },
    codeLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    codeText: { flex: 1, fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 2 },
    copyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
      backgroundColor: colors.primary + '18', borderWidth: 1, borderColor: colors.primary + '40',
    },
    copyBtnDone: { backgroundColor: colors.status.success + '18', borderColor: colors.status.success + '40' },
    copyBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    shareBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 52, marginBottom: 16,
    },
    shareBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 18,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border.default,
    },
    statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 4 },
    statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    sectionCard: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 18,
      marginBottom: 20, borderWidth: 1, borderColor: colors.border.default,
    },
    sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 14 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    stepNum: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    stepNumText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
    stepText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 20, paddingTop: 4 },

    histTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 12 },
    histRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border.subtle,
    },
    histIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
    },
    histLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 3 },
    histDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    histAmount: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.status.success },

    emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
  });
}
