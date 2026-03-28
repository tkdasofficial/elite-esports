import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

export default function AdminBroadcastScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in both title and message.'); return;
    }
    Alert.alert(
      'Send Broadcast',
      `Send "${title}" to all users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            const { error } = await supabase.from('broadcasts').insert({
              title: title.trim(),
              message: message.trim(),
              sent_at: new Date().toISOString(),
            });
            setSending(false);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Sent!', 'Broadcast notification sent to all users.');
              setTitle('');
              setMessage('');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Broadcast" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="notifications-outline" size={20} color={Colors.status.info} />
          <Text style={styles.infoText}>
            Broadcasts are sent to all registered users as push notifications.
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Notification Title</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. New Tournament Live!"
            placeholderTextColor={Colors.text.muted}
            maxLength={80}
          />
        </View>
        <Text style={styles.charCount}>{title.length}/80</Text>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Message</Text>
        <View style={[styles.inputWrapper, styles.textArea]}>
          <TextInput
            style={[styles.input, { textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your message here…"
            placeholderTextColor={Colors.text.muted}
            multiline
            maxLength={300}
          />
        </View>
        <Text style={styles.charCount}>{message.length}/300</Text>

        <TouchableOpacity
          style={[styles.sendBtn, (!title.trim() || !message.trim() || sending) && styles.disabled]}
          onPress={handleSend}
          disabled={!title.trim() || !message.trim() || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={17} color="#fff" />
              <Text style={styles.sendBtnText}>Send to All Users</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12, padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrapper: { backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  textArea: { height: 120, justifyContent: 'flex-start', paddingVertical: 12 },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 54, marginTop: 32,
  },
  disabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
