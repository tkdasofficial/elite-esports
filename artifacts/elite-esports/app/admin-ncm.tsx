import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';

const ADMIN_ID = '6771dad2-8719-48c0-8907-3bb6da336835';

const CHANNELS = [
  { id: 'elite-esports-default',    label: 'General' },
  { id: 'elite-esports-match',      label: 'Match Alert' },
  { id: 'elite-esports-reward',     label: 'Reward' },
  { id: 'elite-esports-tournament', label: 'Tournament' },
  { id: 'elite-esports-account',    label: 'Account' },
];

interface DeviceRegistration {
  id: string;
  duid: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  platform: string;
  is_active: boolean;
}

interface NCMNotificationRow {
  id: string;
  title: string;
  body: string;
  status: string;
  target_user_id: string | null;
  target_duid: string | null;
  channel_id: string;
  created_at: string;
}

export default function AdminNCM() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [broadcast, setBroadcast] = useState(true);
  const [targetUser, setTargetUser] = useState('');
  const [targetDUID, setTargetDUID] = useState('');

  const [sending, setSending] = useState(false);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [notifications, setNotifications] = useState<NCMNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.id === ADMIN_ID;

  const loadData = useCallback(async () => {
    const [devRes, notifRes] = await Promise.all([
      supabase
        .from('device_registrations')
        .select('id, duid, user_id, display_name, email, platform, is_active')
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('ncm_notifications')
        .select('id, title, body, status, target_user_id, target_duid, channel_id, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    if (devRes.data) setDevices(devRes.data);
    if (notifRes.data) setNotifications(notifRes.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Title and message are required.');
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        channel_id: channel,
        status: 'pending',
      };

      if (!broadcast) {
        if (targetUser.trim()) payload.target_user_id = targetUser.trim();
        if (targetDUID.trim()) payload.target_duid = targetDUID.trim();
      }

      const { error } = await supabase.from('ncm_notifications').insert(payload);
      if (error) throw error;

      Alert.alert('Sent', 'Notification queued. Devices will receive it shortly.');
      setTitle('');
      setBody('');
      setTargetUser('');
      setTargetDUID('');
      await loadData();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Admin access required</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>NCM Console</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Send Notification</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Notification title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Notification message"
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={3}
            maxLength={250}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Channel</Text>
          <View style={styles.chipRow}>
            {CHANNELS.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                onPress={() => setChannel(ch.id)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: channel === ch.id ? colors.primary : colors.surface },
                ]}
              >
                <Text style={{ color: channel === ch.id ? '#fff' : colors.text, fontSize: 12 }}>{ch.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary, flex: 1, marginBottom: 0 }]}>Broadcast to all devices</Text>
            <Switch
              value={broadcast}
              onValueChange={setBroadcast}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {!broadcast && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Target User ID (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="UUID of user"
                placeholderTextColor={colors.textSecondary}
                value={targetUser}
                onChangeText={setTargetUser}
                autoCapitalize="none"
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Target DUID (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="e.g. DUID-ABC123-XYZ456"
                placeholderTextColor={colors.textSecondary}
                value={targetDUID}
                onChangeText={setTargetDUID}
                autoCapitalize="characters"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: sending ? colors.border : colors.primary }]}
            onPress={sendNotification}
            disabled={sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>Send Notification</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
          Registered Devices ({devices.filter(d => d.is_active).length} active)
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : (
          devices.map((dev) => (
            <View key={dev.id} style={[styles.deviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
                  {dev.display_name ?? dev.email ?? dev.user_id.slice(0, 12)}
                </Text>
                <Text style={[styles.deviceSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  DUID: {dev.duid}
                </Text>
              </View>
              <View style={styles.deviceMeta}>
                <Ionicons
                  name={dev.platform === 'ios' ? 'logo-apple' : 'logo-android'}
                  size={16}
                  color={colors.textSecondary}
                />
                <View style={[styles.dot, { backgroundColor: dev.is_active ? '#22c55e' : '#ef4444' }]} />
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Recent Notifications</Text>

        {notifications.map((n) => (
          <View key={n.id} style={[styles.notifRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>{n.title}</Text>
              <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={1}>{n.body}</Text>
              <Text style={[styles.notifMeta, { color: colors.textSecondary }]}>
                {n.target_user_id ? `→ User` : n.target_duid ? `→ DUID` : '→ Broadcast'} ·{' '}
                {new Date(n.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: n.status === 'delivered' ? '#22c55e22' : n.status === 'pending' ? '#f59e0b22' : '#ef444422' },
            ]}>
              <Text style={{ color: n.status === 'delivered' ? '#22c55e' : n.status === 'pending' ? '#f59e0b' : '#ef4444', fontSize: 11 }}>
                {n.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, marginTop: 8 },
  backBtn: { marginTop: 8, padding: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  backIcon: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  card: {
    borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 4,
  },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sendBtn: {
    borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  deviceName: { fontWeight: '600', fontSize: 14 },
  deviceSub: { fontSize: 11, marginTop: 2 },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  notifTitle: { fontWeight: '600', fontSize: 14 },
  notifBody: { fontSize: 12, marginTop: 2 },
  notifMeta: { fontSize: 11, marginTop: 4 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
});
