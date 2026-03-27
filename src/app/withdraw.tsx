import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useWallet } from '@/store/WalletContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

export default function WithdrawScreen() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val < 50) { Alert.alert('Invalid Amount', 'Minimum withdrawal is ₹50'); return; }
    if (val > balance) { Alert.alert('Insufficient Balance', `Your balance is ₹${balance.toFixed(2)}`); return; }
    const trimmedUpi = upiId.trim();
    if (!trimmedUpi) { Alert.alert('Required', 'Please enter your UPI ID'); return; }
    if (!trimmedUpi.includes('@')) { Alert.alert('Invalid UPI ID', 'UPI ID must contain "@" (e.g. name@bank)'); return; }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₹${val.toFixed(2)} to ${trimmedUpi}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            setLoading(true);
            const { error } = await supabase.from('transactions').insert({
              user_id: user?.id,
              type: 'debit',
              amount: val,
              status: 'pending',
              description: `Withdrawal to UPI: ${trimmedUpi}`,
            });
            setLoading(false);
            if (error) Alert.alert('Error', error.message);
            else Alert.alert('Requested!', 'Your withdrawal is being processed. It will be credited within 24-48 hours.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Quick Select</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.filter(a => a <= balance).map(a => (
            <TouchableOpacity key={a} style={[styles.quickBtn, amount === String(a) && styles.quickBtnActive]} onPress={() => setAmount(String(a))} activeOpacity={0.8}>
              <Text style={[styles.quickBtnText, amount === String(a) && styles.quickBtnTextActive]}>₹{a}</Text>
            </TouchableOpacity>
          ))}
          {balance >= 1 && (
            <TouchableOpacity style={[styles.quickBtn, amount === String(Math.floor(balance)) && styles.quickBtnActive]} onPress={() => setAmount(String(Math.floor(balance)))} activeOpacity={0.8}>
              <Text style={[styles.quickBtnText, amount === String(Math.floor(balance)) && styles.quickBtnTextActive]}>Max</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Withdrawal Amount</Text>
        <View style={styles.amtBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={Colors.text.muted} keyboardType="numeric" />
        </View>
        <Text style={styles.hint}>Minimum withdrawal: ₹50</Text>

        <Text style={[styles.label, { marginTop: 20 }]}>UPI ID</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="phone-portrait-outline" size={18} color={Colors.text.muted} style={{ marginRight: 10 }} />
          <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="yourname@bank" placeholderTextColor={Colors.text.muted} autoCapitalize="none" autoCorrect={false} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={16} color={Colors.status.warning} />
          <Text style={styles.infoText}>Withdrawals are processed within 24-48 hours after verification</Text>
        </View>

        <TouchableOpacity style={[styles.btn, (loading || !amount || !upiId) && styles.disabled]} onPress={handleSubmit} disabled={loading || !amount || !upiId} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Request Withdrawal</Text>}
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20, paddingBottom: 40 },
  balanceCard: { backgroundColor: Colors.background.card, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.primary + '33', alignItems: 'center' },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  quickBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: Colors.primary },
  quickBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  quickBtnTextActive: { color: Colors.primary },
  amtBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 16, height: 56, marginBottom: 6 },
  rupee: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary, marginRight: 8 },
  amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.status.warning, lineHeight: 18 },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
