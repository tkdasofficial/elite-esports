import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram',   icon: 'logo-instagram' as const, color: '#E1306C' },
  { id: 'facebook',  label: 'Facebook',    icon: 'logo-facebook'  as const, color: '#1877F2' },
  { id: 'youtube',   label: 'YouTube',     icon: 'logo-youtube'   as const, color: '#FF0000' },
  { id: 'twitter',   label: 'X / Twitter', icon: 'logo-twitter'   as const, color: '#1DA1F2' },
  { id: 'tiktok',    label: 'TikTok',      icon: 'logo-tiktok'    as const, color: '#010101' },
  { id: 'snapchat',  label: 'Snapchat',    icon: 'logo-snapchat'  as const, color: '#FFFC00' },
  { id: 'linkedin',  label: 'LinkedIn',    icon: 'logo-linkedin'  as const, color: '#0077B5' },
  { id: 'other',     label: 'Other',       icon: 'globe-outline'  as const, color: '#888888' },
];

const NICHES = ['Gaming', 'Tech', 'Lifestyle', 'Sports', 'Entertainment', 'Other'];

interface Application {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  followers_count: number;
  niche: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reward_amount: number;
  created_at: string;
}

interface Post {
  id: string;
  platform: string;
  post_url: string;
  note: string | null;
  status: 'pending' | 'verified' | 'rejected';
  admin_note: string | null;
  reward_paid: boolean;
  created_at: string;
}

function getPlatform(id: string) {
  return PLATFORMS.find(p => p.id === id) ?? PLATFORMS[PLATFORMS.length - 1];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GetSponsoredScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  // Stage 1 form
  const [selPlatform, setSelPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [followersText, setFollowersText] = useState('');
  const [selNiche, setSelNiche] = useState('Gaming');
  const [appNote, setAppNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Stage 2 form
  const [postUrl, setPostUrl] = useState('');
  const [postNote, setPostNote] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: apps } = await supabase
        .from('sponsorship_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const app = (apps?.[0] ?? null) as Application | null;
      setApplication(app);

      if (app) {
        const { data: postsData } = await supabase
          .from('sponsored_posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('application_id', app.id)
          .order('created_at', { ascending: false });
        setPosts((postsData ?? []) as Post[]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (!user?.id) return;
    if (!selPlatform) {
      Alert.alert('Select Platform', 'Please choose your social media platform.'); return;
    }
    if (!handle.trim()) {
      Alert.alert('Handle Required', 'Enter your @username or channel name.'); return;
    }
    const urlT = profileUrl.trim();
    if (!urlT || (!urlT.startsWith('http://') && !urlT.startsWith('https://'))) {
      Alert.alert('Invalid Profile URL', 'Paste a valid link to your profile (https://...).'); return;
    }
    const followers = parseInt(followersText.replace(/,/g, ''), 10);
    if (!followers || followers < 1) {
      Alert.alert('Follower Count Required', 'Enter your approximate follower / subscriber count.'); return;
    }

    setSubmittingApp(true);
    const { error } = await supabase.from('sponsorship_applications').insert({
      user_id: user.id,
      platform: selPlatform,
      handle: handle.trim(),
      profile_url: urlT,
      followers_count: followers,
      niche: selNiche,
      note: appNote.trim() || null,
    });
    setSubmittingApp(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowNewForm(false);
      Alert.alert('Application Sent!', 'Your sponsorship application has been submitted. We will review it within 24–48 hours.');
      load();
    }
  };

  const handlePostSubmit = async () => {
    if (!user?.id || !application) return;
    const urlT = postUrl.trim();
    if (!urlT || (!urlT.startsWith('http://') && !urlT.startsWith('https://'))) {
      Alert.alert('Invalid URL', 'Paste the link to your published post (https://...).'); return;
    }
    const hasPending = posts.some(p => p.status === 'pending');
    if (hasPending) {
      Alert.alert('Post Under Review', 'You already have a post awaiting verification. Please wait for it to be reviewed.'); return;
    }

    setSubmittingPost(true);
    const { error } = await supabase.from('sponsored_posts').insert({
      user_id: user.id,
      application_id: application.id,
      platform: application.platform,
      post_url: urlT,
      note: postNote.trim() || null,
    });
    setSubmittingPost(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setPostUrl('');
      setPostNote('');
      Alert.alert('Post Submitted!', `Your post link has been submitted. You'll earn ₹${application.reward_amount} once it's verified.`);
      load();
    }
  };

  const openUrl = (url: string) => { if (url) Linking.openURL(url).catch(() => null); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Get Sponsored" />
        <View style={{ padding: 20, gap: 12 }}>
          {[1, 2, 3].map(i => <SkeletonBar key={i} width="100%" height={56} radius={12} />)}
        </View>
      </View>
    );
  }

  const approved = application?.status === 'approved';
  const pending  = application?.status === 'pending';
  const rejected = application?.status === 'rejected';
  const noApp    = !application || showNewForm;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Get Sponsored" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="star" size={15} color={colors.primary} />
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Earn While You Play</Text>
          </View>
          <Text style={styles.heroTitle}>Partner with Elite eSports</Text>
          <Text style={styles.heroSub}>
            Grow your audience, promote our platform, and earn real wallet rewards.
          </Text>
        </View>

        {/* ── REJECTED STATUS → show card + re-apply button ── */}
        {rejected && !showNewForm && application && (
          <>
            <AppStatusCard application={application} colors={colors} styles={styles} openUrl={openUrl} />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => { setShowNewForm(true); setSelPlatform(''); setHandle(''); setProfileUrl(''); setFollowersText(''); setAppNote(''); }}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Apply Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── PENDING STATUS → show review card ── */}
        {pending && application && (
          <AppStatusCard application={application} colors={colors} styles={styles} openUrl={openUrl} />
        )}

        {/* ── APPROVED STATUS → show card + post submission ── */}
        {approved && application && (
          <>
            <AppStatusCard application={application} colors={colors} styles={styles} openUrl={openUrl} />

            <View style={styles.card}>
              <View style={styles.row}>
                <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
                <Text style={styles.cardTitle}>Submit Your Sponsored Post</Text>
              </View>
              <Text style={styles.cardSub}>
                Post about Elite eSports on your {getPlatform(application.platform).label} and paste the link below.
                You'll earn{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>₹{application.reward_amount}</Text>
                {' '}once it's verified.
              </Text>

              <Text style={styles.label}>Post Link</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
                <Ionicons name="link-outline" size={18} color={colors.text.muted} />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.text.muted}
                  value={postUrl}
                  onChangeText={setPostUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <Text style={styles.label}>Note <Text style={styles.optional}>(optional)</Text></Text>
              <View style={[styles.inputWrap, styles.noteWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
                <TextInput
                  style={[styles.input, styles.noteInput, { color: colors.text.primary }]}
                  placeholder="Any context for the reviewer..."
                  placeholderTextColor={colors.text.muted}
                  value={postNote}
                  onChangeText={setPostNote}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handlePostSubmit}
                activeOpacity={0.85}
                disabled={submittingPost}
              >
                {submittingPost
                  ? <ActivityIndicator color="#fff" />
                  : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={styles.btnText}>Submit Post for Review</Text></>}
              </TouchableOpacity>
            </View>

            {posts.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={styles.histTitle}>Submission History</Text>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} colors={colors} styles={styles} openUrl={openUrl} />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── NO APPLICATION / RE-APPLY → show application form ── */}
        {noApp && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Apply to Become a Sponsor</Text>
            <Text style={styles.cardSub}>
              Tell us about your social media presence. Our team reviews every application personally.
            </Text>

            <Text style={styles.label}>Social Media Platform</Text>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => {
                const sel = selPlatform === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.platformChip, {
                      borderColor: sel ? p.color : colors.border.default,
                      backgroundColor: sel ? p.color + '18' : colors.background.elevated,
                    }]}
                    onPress={() => setSelPlatform(p.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={p.icon} size={22} color={sel ? p.color : colors.text.secondary} />
                    <Text style={[styles.platformLabel, { color: sel ? p.color : colors.text.secondary }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Username / Channel Name</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
              <Ionicons name="at" size={18} color={colors.text.muted} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="@yourhandle or Channel Name"
                placeholderTextColor={colors.text.muted}
                value={handle}
                onChangeText={setHandle}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Profile / Channel Link</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
              <Ionicons name="link-outline" size={18} color={colors.text.muted} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="https://instagram.com/yourhandle"
                placeholderTextColor={colors.text.muted}
                value={profileUrl}
                onChangeText={setProfileUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <Text style={styles.label}>Followers / Subscribers Count</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
              <Ionicons name="people-outline" size={18} color={colors.text.muted} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="e.g. 10000"
                placeholderTextColor={colors.text.muted}
                value={followersText}
                onChangeText={setFollowersText}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Content Niche</Text>
            <View style={styles.nicheGrid}>
              {NICHES.map(n => {
                const sel = selNiche === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.nicheChip, {
                      borderColor: sel ? colors.primary : colors.border.default,
                      backgroundColor: sel ? colors.primary + '18' : colors.background.elevated,
                    }]}
                    onPress={() => setSelNiche(n)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.nicheLabel, { color: sel ? colors.primary : colors.text.secondary }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Message to Admin <Text style={styles.optional}>(optional)</Text></Text>
            <View style={[styles.inputWrap, styles.noteWrap, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
              <TextInput
                style={[styles.input, styles.noteInput, { color: colors.text.primary }]}
                placeholder="Tell us why you'd be a great partner..."
                placeholderTextColor={colors.text.muted}
                value={appNote}
                onChangeText={setAppNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.85}
              disabled={submittingApp}
            >
              {submittingApp
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="send-outline" size={18} color="#fff" /><Text style={styles.btnText}>Submit Application</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── HOW IT WORKS (only on fresh apply form) ── */}
        {noApp && (
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How It Works</Text>
            {[
              { step: '1', icon: 'create-outline',      text: 'Fill your platform details and follower count' },
              { step: '2', icon: 'time-outline',         text: 'Admin reviews your application (24–48 hrs)' },
              { step: '3', icon: 'megaphone-outline',    text: 'If approved, post about us on your social media' },
              { step: '4', icon: 'cash-outline',         text: 'Submit the post link and earn wallet rewards' },
            ].map(item => (
              <View key={item.step} style={styles.howRow}>
                <View style={[styles.howNum, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.howNumText, { color: colors.primary }]}>{item.step}</Text>
                </View>
                <Ionicons name={item.icon as any} size={17} color={colors.text.muted} style={{ marginRight: 4 }} />
                <Text style={[styles.howText, { color: colors.text.secondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Application Status Card ─────────────────────────────────────────────── */
function AppStatusCard({
  application, colors, styles, openUrl,
}: {
  application: Application;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  openUrl: (url: string) => void;
}) {
  const platform = getPlatform(application.platform);
  const STATUS = {
    pending:  { label: 'Under Review', color: '#F59E0B', icon: 'time-outline'             as const },
    approved: { label: 'Approved',     color: '#22C55E', icon: 'checkmark-circle-outline'  as const },
    rejected: { label: 'Not Approved', color: '#EF4444', icon: 'close-circle-outline'     as const },
  }[application.status];

  return (
    <View style={[styles.card, { borderColor: STATUS.color + '44', borderWidth: 1.5 }]}>
      <View style={styles.appHeader}>
        <View style={[styles.appIcon, { backgroundColor: platform.color + '18' }]}>
          <Ionicons name={platform.icon} size={24} color={platform.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appHandle, { color: colors.text.primary }]}>{application.handle}</Text>
          <Text style={[styles.appMeta, { color: colors.text.muted }]}>{platform.label} · {application.niche}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS.color + '18' }]}>
          <Ionicons name={STATUS.icon} size={13} color={STATUS.color} />
          <Text style={[styles.statusText, { color: STATUS.color }]}>{STATUS.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color={colors.text.muted} />
          <Text style={[styles.metaVal, { color: colors.text.secondary }]}>
            {application.followers_count.toLocaleString('en-IN')} followers
          </Text>
        </View>
        {application.status === 'approved' && (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={13} color={colors.text.muted} />
            <Text style={[styles.metaVal, { color: colors.text.secondary }]}>₹{application.reward_amount} / post</Text>
          </View>
        )}
        <TouchableOpacity style={styles.metaItem} onPress={() => openUrl(application.profile_url)} activeOpacity={0.75}>
          <Ionicons name="open-outline" size={13} color={colors.primary} />
          <Text style={[styles.metaVal, { color: colors.primary }]}>View Profile</Text>
        </TouchableOpacity>
      </View>

      {application.admin_note ? (
        <View style={[styles.adminNote, { backgroundColor: STATUS.color + '10', borderColor: STATUS.color + '30' }]}>
          <Ionicons name="information-circle-outline" size={14} color={STATUS.color} />
          <Text style={[styles.adminNoteText, { color: colors.text.secondary }]}>{application.admin_note}</Text>
        </View>
      ) : null}

      {application.status === 'pending' && (
        <Text style={[styles.reviewHint, { color: colors.text.muted }]}>
          We typically respond within 24–48 hours.
        </Text>
      )}
    </View>
  );
}

/* ── Post History Card ───────────────────────────────────────────────────── */
function PostCard({ post, colors, styles, openUrl }: {
  post: Post;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  openUrl: (url: string) => void;
}) {
  const STATUS = {
    pending:  { label: 'Pending',  color: '#F59E0B', icon: 'time-outline'             as const },
    verified: { label: 'Verified', color: '#22C55E', icon: 'checkmark-circle-outline'  as const },
    rejected: { label: 'Rejected', color: '#EF4444', icon: 'close-circle-outline'     as const },
  }[post.status];

  return (
    <View style={[styles.postCard, { borderColor: STATUS.color + '33' }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => openUrl(post.post_url)} activeOpacity={0.75}>
            <Text style={[styles.postUrl, { color: colors.primary }]} numberOfLines={1}>{post.post_url}</Text>
          </TouchableOpacity>
          <Text style={[styles.postDate, { color: colors.text.muted }]}>Submitted {fmtDate(post.created_at)}</Text>
          {post.reward_paid && (
            <Text style={[styles.postDate, { color: '#22C55E' }]}>Reward credited to wallet</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS.color + '18' }]}>
          <Ionicons name={STATUS.icon} size={12} color={STATUS.color} />
          <Text style={[styles.statusText, { color: STATUS.color }]}>{STATUS.label}</Text>
        </View>
      </View>
      {post.admin_note ? (
        <Text style={[styles.postAdminNote, { color: colors.text.muted }]}>{post.admin_note}</Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll:    { padding: 16, gap: 16 },
    row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },

    hero:          { alignItems: 'center', paddingVertical: 20, gap: 10 },
    heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    heroBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    heroTitle:     { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    heroSub:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },

    card:     { backgroundColor: colors.background.card, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border.default },
    cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    cardSub:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 20 },

    label:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    optional: { fontFamily: 'Inter_400Regular', color: colors.text.muted },

    platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    platformChip: {
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 4, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1.5, minWidth: 68, flexGrow: 1,
    },
    platformLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

    nicheGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    nicheChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    nicheLabel:{ fontSize: 12, fontFamily: 'Inter_600SemiBold' },

    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, borderWidth: 1 },
    input:     { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
    noteWrap:  { alignItems: 'flex-start', minHeight: 80, paddingVertical: 10 },
    noteInput: { flex: 1, width: '100%', fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 0 },

    btn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, height: 52, marginTop: 4 },
    btnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

    appHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    appIcon:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    appHandle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    appMeta:   { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaVal:   { fontSize: 12, fontFamily: 'Inter_400Regular' },

    adminNote:     { flexDirection: 'row', gap: 8, borderRadius: 10, padding: 10, borderWidth: 1 },
    adminNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    reviewHint:    { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
    statusText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

    histTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    postCard:  { backgroundColor: colors.background.card, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
    postUrl:   { fontSize: 13, fontFamily: 'Inter_500Medium' },
    postDate:  { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
    postAdminNote: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

    howCard:    { backgroundColor: colors.background.card, borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: colors.border.default },
    howTitle:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    howRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    howNum:     { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    howNumText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
    howText:    { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  });
}
