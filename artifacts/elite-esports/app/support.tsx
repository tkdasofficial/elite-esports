import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const CATEGORIES = ['Match Issue', 'Payment Problem', 'Account Help', 'Bug Report', 'Other'];

export default function SupportScreen() {
  const { user }    = useAuth();
  const insets      = useSafeAreaInsets();
  const { colors }  = useTheme();
  const styles      = useMemo(() => createStyles(colors), [colors]);

  const [category, setCategory] = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Required', 'Please select a category.'); return; }
    if (!subject.trim())  { Alert.alert('Required', 'Please enter a subject.'); return; }
    if (!message.trim())  { Alert.alert('Required', 'Please describe your issue.'); return; }
    setLoading(true);
    const fullMessage = `[${category}] ${subject.trim()}\n\n${message.trim()}`;
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id, message: fullMessage, status: 'open',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCategory('');
      setSubject('');
      setMessage('');
      setSuccess(true);
    }
  };

  const handleNewTicket = () => setSuccess(false);

  /* ── Success state ── */
  if (success) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Support" />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Ticket Submitted!</Text>
          <Text style={styles.successSub}>
            Our support team will review your request and get back to you within 24 hours.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={handleNewTicket} activeOpacity={0.85}>
            <Text style={styles.btnText}>Submit Another Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Form ── */
  return (
    <View style={styles.container}>
      <ScreenHeader title="Support" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner */}
          <View style={styles.banner}>
            <Ionicons name="headset" size={36} color={colors.primary} />
            <Text style={styles.bannerTitle}>How can we help?</Text>
            <Text style={styles.bannerSub}>We'll respond within 24 hours</Text>
          </View>

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              placeholderTextColor={colors.text.muted}
              returnKeyType="next"
              maxLength={120}
            />
          </View>

          {/* Message */}
          <Text style={styles.label}>Message</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue in as much detail as possible..."
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{message.length}/1000</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, (!category || !subject.trim() || !message.trim() || loading) && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading || !category || !subject.trim() || !message.trim()}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.btnInner}>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.btnText}>Submit Ticket</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background.dark },
    scroll:       { padding: 20 },

    /* banner */
    banner:       { backgroundColor: colors.background.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.border.default },
    bannerTitle:  { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    bannerSub:    { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary },

    /* label */
    label:        { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 8 },

    /* category */
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    catBtn:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.default },
    catBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: colors.primary },
    catBtnText:   { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    catBtnTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },

    /* inputs */
    inputWrapper: {
      backgroundColor: colors.background.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 16,
    },
    input: {
      color: colors.text.primary,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      minHeight: 22,
    },
    textAreaWrapper: {
      backgroundColor: colors.background.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      marginBottom: 20,
      minHeight: 150,
    },
    textArea: {
      color: colors.text.primary,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      minHeight: 110,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
      textAlign: 'right',
      marginTop: 4,
    },

    /* button */
    btn:      { backgroundColor: colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    disabled: { opacity: 0.45 },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

    /* success */
    successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
    successIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(254,76,17,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    successTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    successSub:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  });
}
