import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const ADMIN_ID = '6771dad2-8719-48c0-8907-3bb6da336835';

const PLATFORMS: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram',   icon: 'logo-instagram', color: '#E1306C' },
  facebook:  { label: 'Facebook',    icon: 'logo-facebook',  color: '#1877F2' },
  youtube:   { label: 'YouTube',     icon: 'logo-youtube',   color: '#FF0000' },
  twitter:   { label: 'X / Twitter', icon: 'logo-twitter',   color: '#1DA1F2' },
  tiktok:    { label: 'TikTok',      icon: 'logo-tiktok',    color: '#010101' },
  snapchat:  { label: 'Snapchat',    icon: 'logo-snapchat',  color: '#FFFC00' },
  linkedin:  { label: 'LinkedIn',    icon: 'logo-linkedin',  color: '#0077B5' },
  other:     { label: 'Other',       icon: 'globe-outline',  color: '#888888' },
};

interface Application {
  id: string;
  user_id: string;
  platform: string;
  handle: string;
  profile_url: string;
  followers_count: number;
  niche: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reward_amount: number;
  reviewed_at: string | null;
  created_at: string;
  users?: { username: string; email: string; avatar_url?: string } | null;
}

interface Post {
  id: string;
  user_id: string;
  application_id: string;
  platform: string;
  post_url: string;
  note: string | null;
  status: 'pending' | 'verified' | 'rejected';
  admin_note: string | null;
  reward_paid: boolean;
  created_at: string;
  users?: { username: string; email: string } | null;
  sponsorship_applications?: { handle: string; reward_amount: number } | null;
}

type Tab = 'applications' | 'posts';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtFollowers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function AdminSponsorshipsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>('applications');

  useEffect(() => {
    if (user && user.id !== ADMIN_ID) {
      Alert.alert('Access Denied', 'Admin only.');
      router.back();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Sponsorship Manager" />

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border.default }]}>
        {(['applications', 'posts'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={t === 'applications' ? 'person-add-outline' : 'document-text-outline'}
              size={15}
              color={tab === t ? colors.primary : colors.text.muted}
            />
            <Text style={[styles.tabLabel, { color: tab === t ? colors.primary : colors.text.muted }]}>
              {t === 'applications' ? 'Applications' : 'Posts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'applications'
        ? <ApplicationsTab colors={colors} styles={styles} insets={insets} />
        : <PostsTab colors={colors} styles={styles} insets={insets} />
      }
    </View>
  );
}

/* ─────────────────────────────────────────────────────────── APPLICATIONS TAB */
function ApplicationsTab({ colors, styles, insets }: {
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  insets: { bottom: number };
}) {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('sponsorship_applications')
      .select('*, users(username, email, avatar_url)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query.eq('status', filter);
    const { data } = await query;
    setItems((data ?? []) as Application[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openUrl = (url: string) => { if (url) Linking.openURL(url).catch(() => null); };

  const approve = async (item: Application) => {
    Alert.prompt(
      'Approve Application',
      `Set reward per post for ${item.handle} (default: ₹${item.reward_amount}):`,
      async (input) => {
        const reward = input ? parseFloat(input) : item.reward_amount;
        if (isNaN(reward) || reward <= 0) {
          Alert.alert('Invalid', 'Enter a valid reward amount.'); return;
        }
        const { error } = await supabase
          .from('sponsorship_applications')
          .update({ status: 'approved', reward_amount: reward, reviewed_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) { Alert.alert('Error', error.message); return; }

        await supabase.from('notifications').insert({
          user_id: item.user_id,
          title: 'Sponsorship Approved! 🎉',
          message: `Congratulations! Your ${PLATFORMS[item.platform]?.label ?? item.platform} sponsorship application has been approved. You can now submit your sponsored post and earn ₹${reward}.`,
          type: 'info',
        });
        load();
      },
      'plain-text',
      String(item.reward_amount),
      'number-pad',
    );
  };

  const reject = async (item: Application) => {
    Alert.prompt(
      'Reject Application',
      'Optional: Enter a reason for rejection (shown to user):',
      async (input) => {
        const { error } = await supabase
          .from('sponsorship_applications')
          .update({
            status: 'rejected',
            admin_note: input?.trim() || 'Your application did not meet our current requirements.',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        if (error) { Alert.alert('Error', error.message); return; }

        await supabase.from('notifications').insert({
          user_id: item.user_id,
          title: 'Sponsorship Application Update',
          message: `We've reviewed your ${PLATFORMS[item.platform]?.label ?? item.platform} sponsorship application. Unfortunately it was not approved at this time. ${input?.trim() ? 'Reason: ' + input.trim() : 'You can re-apply in the future.'}`,
          type: 'info',
        });
        load();
      },
      'plain-text',
    );
  };

  const FILTERS: Array<{ key: typeof filter; label: string }> = [
    { key: 'pending',  label: 'Pending'  },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all',      label: 'All'      },
  ];

  const STATUS_CFG = {
    pending:  { color: '#F59E0B', label: 'Pending'  },
    approved: { color: '#22C55E', label: 'Approved' },
    rejected: { color: '#EF4444', label: 'Rejected' },
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterLabel, { color: filter === f.key ? colors.primary : colors.text.secondary }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? [1, 2, 3].map(i => <SkeletonBar key={i} height={120} borderRadius={14} />)
        : items.length === 0
          ? (
            <View style={styles.empty}>
              <Ionicons name="person-add-outline" size={40} color={colors.text.muted} />
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>No {filter !== 'all' ? filter : ''} applications</Text>
            </View>
          )
          : items.map(item => {
              const pf = PLATFORMS[item.platform] ?? PLATFORMS.other;
              const st = STATUS_CFG[item.status];
              return (
                <View key={item.id} style={styles.card}>
                  {/* Header row */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.platformIcon, { backgroundColor: pf.color + '18' }]}>
                      <Ionicons name={pf.icon as any} size={20} color={pf.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardUser, { color: colors.text.primary }]}>
                        {item.users?.username ?? '—'}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.text.muted }]}>
                        {item.users?.email ?? ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '18' }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Details grid */}
                  <View style={styles.detailGrid}>
                    <DetailRow icon="at" label="Handle"    value={item.handle} colors={colors} styles={styles} />
                    <DetailRow icon="people-outline" label="Followers" value={`${fmtFollowers(item.followers_count)} (${item.followers_count.toLocaleString('en-IN')})`} colors={colors} styles={styles} />
                    <DetailRow icon="game-controller-outline" label="Niche" value={item.niche} colors={colors} styles={styles} />
                    <DetailRow icon="calendar-outline" label="Applied"  value={fmtDate(item.created_at)} colors={colors} styles={styles} />
                  </View>

                  {/* Profile link */}
                  <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(item.profile_url)} activeOpacity={0.75}>
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>{item.profile_url}</Text>
                  </TouchableOpacity>

                  {/* Applicant note */}
                  {item.note ? (
                    <View style={[styles.noteBox, { backgroundColor: colors.background.elevated }]}>
                      <Text style={[styles.noteLabel, { color: colors.text.muted }]}>Applicant's Note:</Text>
                      <Text style={[styles.noteText, { color: colors.text.secondary }]}>{item.note}</Text>
                    </View>
                  ) : null}

                  {/* Admin note (if rejected) */}
                  {item.admin_note ? (
                    <View style={[styles.noteBox, { backgroundColor: '#EF444412', borderColor: '#EF444430' }]}>
                      <Text style={[styles.noteLabel, { color: '#EF4444' }]}>Admin Note:</Text>
                      <Text style={[styles.noteText, { color: colors.text.secondary }]}>{item.admin_note}</Text>
                    </View>
                  ) : null}

                  {/* Actions — only for pending */}
                  {item.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#22C55E18', borderColor: '#22C55E44' }]}
                        onPress={() => approve(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
                        <Text style={[styles.actionText, { color: '#22C55E' }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF444418', borderColor: '#EF444444' }]}
                        onPress={() => reject(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
      }
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────── POSTS TAB */
function PostsTab({ colors, styles, insets }: {
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  insets: { bottom: number };
}) {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('sponsored_posts')
      .select('*, users(username, email), sponsorship_applications(handle, reward_amount)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query.eq('status', filter);
    const { data } = await query;
    setItems((data ?? []) as Post[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openUrl = (url: string) => { if (url) Linking.openURL(url).catch(() => null); };

  const verifyPost = async (post: Post) => {
    setVerifying(post.id);
    const { data, error } = await supabase.rpc('verify_sponsored_post', {
      _post_id:       post.id,
      _reward_amount: null,
    });
    setVerifying(null);

    if (error || !data?.success) {
      Alert.alert('Error', error?.message ?? data?.error ?? 'Failed to verify post.');
    } else {
      Alert.alert('Verified!', `₹${data.reward_amount} has been credited to the user's wallet.`);
      load();
    }
  };

  const rejectPost = async (post: Post) => {
    Alert.prompt(
      'Reject Post',
      'Enter a reason (shown to user):',
      async (input) => {
        const { error } = await supabase
          .from('sponsored_posts')
          .update({ status: 'rejected', admin_note: input?.trim() || 'Post did not meet requirements.' })
          .eq('id', post.id);
        if (error) { Alert.alert('Error', error.message); return; }

        await supabase.from('notifications').insert({
          user_id: post.user_id,
          title: 'Sponsored Post Update',
          message: `Your sponsored post was not approved. ${input?.trim() ? 'Reason: ' + input.trim() : 'Please ensure the post is public and mentions Elite eSports.'}`,
          type: 'info',
        });
        load();
      },
      'plain-text',
    );
  };

  const FILTERS: Array<{ key: typeof filter; label: string }> = [
    { key: 'pending',  label: 'Pending'  },
    { key: 'verified', label: 'Verified' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all',      label: 'All'      },
  ];

  const STATUS_CFG = {
    pending:  { color: '#F59E0B', label: 'Pending'  },
    verified: { color: '#22C55E', label: 'Verified' },
    rejected: { color: '#EF4444', label: 'Rejected' },
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterLabel, { color: filter === f.key ? colors.primary : colors.text.secondary }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? [1, 2, 3].map(i => <SkeletonBar key={i} height={120} borderRadius={14} />)
        : items.length === 0
          ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={40} color={colors.text.muted} />
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>No {filter !== 'all' ? filter : ''} posts</Text>
            </View>
          )
          : items.map(post => {
              const pf = PLATFORMS[post.platform] ?? PLATFORMS.other;
              const st = STATUS_CFG[post.status];
              const reward = post.sponsorship_applications?.reward_amount ?? 50;
              return (
                <View key={post.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.platformIcon, { backgroundColor: pf.color + '18' }]}>
                      <Ionicons name={pf.icon as any} size={20} color={pf.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardUser, { color: colors.text.primary }]}>
                        {post.users?.username ?? '—'}
                        {post.sponsorship_applications?.handle
                          ? <Text style={{ color: colors.text.muted, fontFamily: 'Inter_400Regular' }}>  @{post.sponsorship_applications.handle}</Text>
                          : null}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.text.muted }]}>{fmtDate(post.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '18' }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Post URL */}
                  <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(post.post_url)} activeOpacity={0.75}>
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={2}>{post.post_url}</Text>
                  </TouchableOpacity>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={13} color={colors.text.muted} />
                      <Text style={[styles.metaVal, { color: colors.text.secondary }]}>₹{reward} reward</Text>
                    </View>
                    {post.reward_paid && (
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
                        <Text style={[styles.metaVal, { color: '#22C55E' }]}>Paid</Text>
                      </View>
                    )}
                  </View>

                  {post.note ? (
                    <View style={[styles.noteBox, { backgroundColor: colors.background.elevated }]}>
                      <Text style={[styles.noteLabel, { color: colors.text.muted }]}>User Note:</Text>
                      <Text style={[styles.noteText, { color: colors.text.secondary }]}>{post.note}</Text>
                    </View>
                  ) : null}

                  {post.admin_note ? (
                    <View style={[styles.noteBox, { backgroundColor: '#EF444412', borderColor: '#EF444430' }]}>
                      <Text style={[styles.noteLabel, { color: '#EF4444' }]}>Admin Note:</Text>
                      <Text style={[styles.noteText, { color: colors.text.secondary }]}>{post.admin_note}</Text>
                    </View>
                  ) : null}

                  {post.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#22C55E18', borderColor: '#22C55E44', flex: 1 }]}
                        onPress={() => verifyPost(post)}
                        activeOpacity={0.8}
                        disabled={verifying === post.id}
                      >
                        {verifying === post.id
                          ? <ActivityIndicator size="small" color="#22C55E" />
                          : <>
                              <Ionicons name="shield-checkmark-outline" size={16} color="#22C55E" />
                              <Text style={[styles.actionText, { color: '#22C55E' }]}>Verify & Credit ₹{reward}</Text>
                            </>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF444418', borderColor: '#EF444444' }]}
                        onPress={() => rejectPost(post)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
      }
    </ScrollView>
  );
}

/* ── Detail Row helper ─────────────────────────────────────────────────────── */
function DetailRow({ icon, label, value, colors, styles }: {
  icon: string; label: string; value: string;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={13} color={colors.text.muted} />
      <Text style={[styles.detailLabel, { color: colors.text.muted }]}>{label}:</Text>
      <Text style={[styles.detailVal, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll:    { padding: 16, gap: 14 },

    tabBar:  { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    tabLabel:{ fontSize: 13, fontFamily: 'Inter_600SemiBold' },

    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    filterChip:{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.background.elevated },
    filterLabel:{ fontSize: 12, fontFamily: 'Inter_600SemiBold' },

    card: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 16, gap: 12,
      borderWidth: 1, borderColor: colors.border.default,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    platformIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardUser: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    cardSub:  { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },

    statusBadge:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
    statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

    detailGrid: { gap: 6 },
    detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    detailLabel:{ fontSize: 12, fontFamily: 'Inter_500Medium', minWidth: 60 },
    detailVal:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },

    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    linkText:{ fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },

    metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    metaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaVal: { fontSize: 12, fontFamily: 'Inter_400Regular' },

    noteBox: { borderRadius: 10, padding: 10, gap: 2, borderWidth: 1, borderColor: colors.border.default },
    noteLabel:{ fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    noteText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },

    actionRow:{ flexDirection: 'row', gap: 10 },
    actionBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
    actionText:{ fontSize: 13, fontFamily: 'Inter_600SemiBold' },

    empty:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyText:{ fontSize: 14, fontFamily: 'Inter_500Medium' },
  });
}
