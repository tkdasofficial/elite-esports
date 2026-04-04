import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform,
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
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'facebook',  label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2' },
  { id: 'youtube',   label: 'YouTube',   icon: 'logo-youtube',   color: '#FF0000' },
  { id: 'twitter',   label: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: 'logo-linkedin',  color: '#0077B5' },
  { id: 'snapchat',  label: 'Snapchat',  icon: 'logo-snapchat',  color: '#FFFC00' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'logo-tiktok',    color: '#010101' },
  { id: 'other',     label: 'Other',     icon: 'globe-outline',  color: '#888888' },
];

const STATUS_CONFIG = {
  open:        { label: 'Pending',  color: '#F59E0B', bg: '#F59E0B18' },
  in_progress: { label: 'Reviewing', color: '#3B82F6', bg: '#3B82F618' },
  resolved:    { label: 'Approved', color: '#22C55E', bg: '#22C55E18' },
};

interface Submission {
  id: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

function parseCategory(msg: string) {
  const match = msg.match(/^\[([^\]]+)\]/);
  return match ? match[1] : 'Other';
}

function parseUrl(msg: string) {
  const lines = msg.split('\n');
  for (const line of lines) {
    if (line.startsWith('URL:')) return line.replace('URL:', '').trim();
  }
  return '';
}

export default function GetSponsoredScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubmissions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('id, message, status, created_at')
        .eq('user_id', user.id)
        .like('message', '[sponsorship%')
        .order('created_at', { ascending: false });
      if (data) setSubmissions(data as Submission[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!selectedPlatform) {
      Alert.alert('Select Platform', 'Please select a social media platform.');
      return;
    }
    const urlTrimmed = postUrl.trim();
    if (!urlTrimmed) {
      Alert.alert('Post Link Required', 'Please paste the link to your social media post.');
      return;
    }
    if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyToday = submissions.some(s => new Date(s.created_at) >= today);
    if (alreadyToday) {
      Alert.alert('Limit Reached', 'You can only submit one sponsorship request per day. Please try again tomorrow.');
      return;
    }

    const isDuplicate = submissions.some(s => parseUrl(s.message) === urlTrimmed);
    if (isDuplicate) {
      Alert.alert('Duplicate Link', 'You have already submitted this post link.');
      return;
    }

    const platform = PLATFORMS.find(p => p.id === selectedPlatform);
    const message = `[sponsorship:${selectedPlatform}] ${platform?.label ?? selectedPlatform}\nURL: ${urlTrimmed}${note.trim() ? '\nNote: ' + note.trim() : ''}`;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: 'sponsorship',
          subject: `Sponsorship - ${platform?.label}`,
          message,
          status: 'open',
        });
      if (error) throw error;
      Alert.alert('Submitted!', "Your sponsorship submission is under review. You'll be notified when approved.");
      setPostUrl('');
      setNote('');
      setSelectedPlatform(null);
      loadSubmissions();
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScreenHeader title="Get Sponsored" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="star" size={28} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Get Sponsored</Text>
            <Text style={styles.heroSub}>
              Post about Elite eSports on social media, submit the link, and earn wallet rewards when approved!
            </Text>
          </View>

          {/* Reward Info Strip */}
          <View style={styles.rewardStrip}>
            <View style={styles.rewardItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.rewardText}>Wallet credit on approval</Text>
            </View>
            <View style={styles.rewardDot} />
            <View style={styles.rewardItem}>
              <Ionicons name="time-outline" size={16} color={colors.text.muted} />
              <Text style={styles.rewardText}>1 submission per day</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Step 1 - Platform */}
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepTitle}>Select Platform</Text>
            </View>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => {
                const selected = selectedPlatform === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.platformChip,
                      selected
                        ? { borderColor: p.color, backgroundColor: p.color + '18' }
                        : { borderColor: colors.border.default, backgroundColor: colors.background.elevated },
                    ]}
                    onPress={() => setSelectedPlatform(p.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={p.icon as any} size={18} color={selected ? p.color : colors.text.muted} />
                    <Text style={[styles.platformLabel, { color: selected ? p.color : colors.text.secondary }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

            {/* Step 2 - URL */}
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepTitle}>Post Link</Text>
            </View>
            <View style={[styles.inputWrap, { borderColor: colors.border.default, backgroundColor: colors.background.elevated }]}>
              <Ionicons name="link-outline" size={18} color={colors.text.muted} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={postUrl}
                onChangeText={setPostUrl}
                placeholder="https://instagram.com/p/..."
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
              {!!postUrl && (
                <TouchableOpacity onPress={() => setPostUrl('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

            {/* Step 3 - Note */}
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.stepTitle}>Additional Note</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
            </View>
            <View style={[styles.inputWrap, styles.noteWrap, { borderColor: colors.border.default, backgroundColor: colors.background.elevated }]}>
              <TextInput
                style={[styles.noteInput, { color: colors.text.primary }]}
                value={note}
                onChangeText={setNote}
                placeholder="Describe your post or audience reach..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Ionicons name={submitting ? 'hourglass-outline' : 'send'} size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit for Review'}</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <Text style={styles.histTitle}>Submission History</Text>
          {loading ? (
            <View style={{ gap: 10 }}>
              {[1, 2].map(i => <SkeletonBar key={i} width="100%" height={76} radius={14} />)}
            </View>
          ) : submissions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={44} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No submissions yet</Text>
              <Text style={styles.emptySub}>Submit your first post to get started!</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {submissions.map(item => {
                const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
                const platformId = item.message.match(/^\[sponsorship:([^\]]+)/)?.[1] ?? 'other';
                const platformInfo = PLATFORMS.find(p => p.id === platformId);
                const url = parseUrl(item.message);
                return (
                  <View key={item.id} style={[styles.histRow, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
                    <View style={[styles.histIconWrap, { backgroundColor: (platformInfo?.color ?? colors.primary) + '18' }]}>
                      <Ionicons
                        name={(platformInfo?.icon ?? 'globe-outline') as any}
                        size={20}
                        color={platformInfo?.color ?? colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.histPlatform, { color: colors.text.primary }]} numberOfLines={1}>
                        {platformInfo?.label ?? 'Other'}
                      </Text>
                      {!!url && (
                        <Text style={[styles.histUrl, { color: colors.text.muted }]} numberOfLines={1}>{url}</Text>
                      )}
                      <Text style={[styles.histDate, { color: colors.text.muted }]}>
                        {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 16, gap: 14 },

    heroCard: {
      backgroundColor: colors.background.card, borderRadius: 20, padding: 24,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border.default,
    },
    heroIcon: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 8 },
    heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 21 },

    rewardStrip: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
      gap: 12, borderWidth: 1, borderColor: colors.border.default,
    },
    rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rewardText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    rewardDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border.default },

    formCard: {
      backgroundColor: colors.background.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: colors.border.default,
    },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    stepNum: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    stepNumText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
    stepTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    optionalBadge: {
      fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.text.muted,
      backgroundColor: colors.background.elevated, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border.default,
    },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: 18 },

    platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    platformChip: {
      width: '22%',
      flexGrow: 1,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 5, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
      minWidth: 72,
    },
    platformLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },

    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, paddingHorizontal: 14, minHeight: 48,
      borderWidth: 1,
    },
    input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
    noteWrap: { alignItems: 'flex-start', minHeight: 90, paddingVertical: 12 },
    noteInput: {
      flex: 1, width: '100%',
      fontSize: 14, fontFamily: 'Inter_400Regular',
      paddingVertical: 0,
    },

    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, height: 52, marginTop: 4,
    },
    submitBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

    histTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    histRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, padding: 14,
      borderWidth: 1,
    },
    histIconWrap: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    histPlatform: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
    histUrl: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 3 },
    histDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
    statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

    emptyWrap: { alignItems: 'center', paddingVertical: 36, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
  });
}
