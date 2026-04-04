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
  open:        { label: 'Pending',  color: '#F59E0B' },
  in_progress: { label: 'Reviewing', color: '#3B82F6' },
  resolved:    { label: 'Approved', color: '#22C55E' },
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

    // Anti-spam: max 1 per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyToday = submissions.some(s => new Date(s.created_at) >= today);
    if (alreadyToday) {
      Alert.alert('Limit Reached', 'You can only submit one sponsorship request per day. Please try again tomorrow.');
      return;
    }

    // Check for duplicate URL
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
      Alert.alert('Submitted!', 'Your sponsorship submission is under review. You\'ll be notified when approved.');
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
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="trophy-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Get Sponsored</Text>
            <Text style={styles.heroSub}>
              Post about Elite eSports on social media and submit the link. Get reviewed and earn wallet rewards!
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>1. Select Platform</Text>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => {
                const selected = selectedPlatform === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.platformChip, selected && { borderColor: p.color, backgroundColor: p.color + '18' }]}
                    onPress={() => setSelectedPlatform(p.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={p.icon as any} size={16} color={selected ? p.color : colors.text.muted} />
                    <Text style={[styles.platformLabel, selected && { color: p.color }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.formLabel, { marginTop: 16 }]}>2. Post Link</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="link-outline" size={18} color={colors.text.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={postUrl}
                onChangeText={setPostUrl}
                placeholder="https://instagram.com/p/..."
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.formLabel, { marginTop: 14 }]}>3. Additional Note (optional)</Text>
            <View style={[styles.inputWrap, styles.noteWrap]}>
              <TextInput
                style={styles.noteTextInput}
                value={note}
                onChangeText={setNote}
                placeholder="Describe your post or reach..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Ionicons name={submitting ? 'hourglass-outline' : 'send-outline'} size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit for Review'}</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <Text style={styles.histTitle}>Submission History</Text>
          {loading ? (
            <View style={{ gap: 10 }}>
              {[1, 2].map(i => <SkeletonBar key={i} width="100%" height={72} radius={14} />)}
            </View>
          ) : submissions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={44} color={colors.text.muted} />
              <Text style={styles.emptyText}>No submissions yet</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {submissions.map(item => {
                const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
                const platform = parseCategory(item.message);
                const url = parseUrl(item.message);
                return (
                  <View key={item.id} style={styles.histRow}>
                    <View style={styles.histIconWrap}>
                      <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.histPlatform} numberOfLines={1}>{platform}</Text>
                      {!!url && <Text style={styles.histUrl} numberOfLines={1}>{url}</Text>}
                      <Text style={styles.histDate}>
                        {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
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
    scroll: { padding: 16 },

    heroCard: {
      backgroundColor: colors.background.card, borderRadius: 20, padding: 22,
      alignItems: 'center', marginBottom: 16,
      borderWidth: 1, borderColor: colors.border.default,
    },
    heroIcon: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: colors.primary + '18',
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    heroTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 6 },
    heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 19 },

    formCard: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 18,
      marginBottom: 20, borderWidth: 1, borderColor: colors.border.default,
    },
    formLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 10 },

    platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    platformChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border.default,
      backgroundColor: colors.background.elevated,
    },
    platformLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text.muted },

    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated, borderRadius: 12,
      paddingHorizontal: 14, minHeight: 48,
      borderWidth: 1, borderColor: colors.border.default,
    },
    input: { flex: 1, color: colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 12 },
    noteWrap: { alignItems: 'flex-start', minHeight: 80, paddingVertical: 12 },
    noteTextInput: {
      flex: 1, width: '100%',
      color: colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular',
      paddingVertical: 0,
    },

    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 52, marginTop: 18,
    },
    submitBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

    histTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 12 },
    histRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border.subtle,
    },
    histIconWrap: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
    },
    histPlatform: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 2 },
    histUrl: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginBottom: 2 },
    histDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
    statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

    emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text.muted },
  });
}
