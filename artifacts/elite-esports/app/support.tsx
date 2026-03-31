import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category || !subject || !message) { Alert.alert('Required', 'Please fill all fields'); return; }
    setLoading(true);
    const fullMessage = `[${category}] ${subject}\n\n${message}`;
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id, message: fullMessage, status: 'open',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else { setCategory(''); setSubject(''); setMessage(''); Alert.alert('Submitted!', 'Our team will respond within 24 hours.'); }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Support" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="headset" size={36} color={colors.primary} />
          <Text style={styles.bannerTitle}>How can we help?</Text>
          <Text style={styles.bannerSub}>We'll respond within 24 hours</Text>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]} onPress={() => setCategory(cat)} activeOpacity={0.8}>
              <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Subject</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Brief description" placeholderTextColor={colors.text.muted} />
        </View>

        <Text style={styles.label}>Message</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Describe your issue in detail..." placeholderTextColor={colors.text.muted} multiline numberOfLines={5} textAlignVertical="top" />
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Ticket</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 20, paddingBottom: 40 },
    banner: { backgroundColor: colors.background.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.border.default },
    bannerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    bannerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary },
    label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 8 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.default },
    catBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: colors.primary },
    catBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    catBtnTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
    inputWrapper: { backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center', marginBottom: 16 },
    textAreaWrapper: { height: 120, alignItems: 'flex-start', paddingTop: 14 },
    input: { color: colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
    textArea: { height: 92, textAlignVertical: 'top' },
    btn: { backgroundColor: colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    disabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  });
}
