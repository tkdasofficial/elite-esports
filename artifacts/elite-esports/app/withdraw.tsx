import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WithdrawScreen() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val < 50) { Alert.alert('Invalid', 'Minimum withdrawal is ₹50'); return; }
    if (val > balance) { Alert.alert('Insufficient', 'You don\'t have enough balance'); return; }
    if (!upiId.trim()) { Alert.alert('Required', 'Please enter your UPI ID'); return; }

    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: user?.id, type: 'debit', amount: val,
      status: 'pending', description: `Withdrawal to UPI: ${upiId}`,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Requested!', 'Your withdrawal is being processed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        {/* Amount */}
        <Text style={styles.label}>Withdrawal Amount</Text>
        <View style={styles.inputBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.amtInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor={Colors.text.muted}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.hint}>Minimum withdrawal: ₹50</Text>

        {/* UPI */}
        <Text style={[styles.label, { marginTop: 20 }]}>UPI ID</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="phone-portrait-outline" size={18} color={Colors.text.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            value={upiId}
            onChangeText={setUpiId}
            placeholder="yourname@bank"
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={16} color={Colors.status.warning} />
          <Text style={styles.infoText}>Withdrawals are processed within 24-48 hours</Text>
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Request Withdrawal</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: Colors.background.card, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.primary + '33', alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.card, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border.default, paddingHorizontal: 16, height: 56, marginBottom: 6,
  },
  rupee: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary, marginRight: 8 },
  amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border.default, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.status.warning, lineHeight: 18 },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
