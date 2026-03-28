import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

const CATEGORIES = ['Match Issue', 'Payment Problem', 'Account Help', 'Bug Report', 'Other'];

export default function SupportScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
          <Ionicons name="headset" size={36} color={Colors.primary} />
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
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Brief description" placeholderTextColor={Colors.text.muted} />
        </View>

        <Text style={styles.label}>Message</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Describe your issue in detail..." placeholderTextColor={Colors.text.muted} multiline numberOfLines={5} textAlignVertical="top" />
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Ticket</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: { backgroundColor: Colors.background.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24, borderWidth: 1, borderColor: Colors.border.default },
  bannerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  bannerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  catBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: Colors.primary },
  catBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  catBtnTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  inputWrapper: { backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center', marginBottom: 16 },
  textAreaWrapper: { height: 120, alignItems: 'flex-start', paddingTop: 14 },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textArea: { height: 92, textAlignVertical: 'top' },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
