import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
type Step = 'amount' | 'payment' | 'confirm';
const STEPS: Step[] = ['amount', 'payment', 'confirm'];

export default function AddMoneyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('amount');

  const handleNext = () => {
    const val = parseFloat(amount);
    if (!val || val < 10) { Alert.alert('Invalid Amount', 'Minimum deposit is ₹10'); return; }
    setStep('payment');
  };

  const handleSubmit = async () => {
    const trimmedUtr = utr.trim();
    if (!trimmedUtr) { Alert.alert('Required', 'Please enter your transaction ID'); return; }
    if (trimmedUtr.length < 6) { Alert.alert('Invalid', 'Please enter a valid UTR number'); return; }
    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: user?.id,
      type: 'credit',
      amount: parseFloat(amount),
      status: 'pending',
      description: `Deposit via UPI — UTR: ${trimmedUtr}`,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Submitted!', 'Your deposit request has been received and will be credited within 30 minutes.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const StepIndicator = () => (
    <View style={styles.steps}>
      {(['Amount', 'Payment', 'Confirm'] as const).map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step === STEPS[i] && styles.stepActive, STEPS.indexOf(step) > i && styles.stepDone]}>
              {STEPS.indexOf(step) > i
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={styles.stepNum}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, step === STEPS[i] && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < 2 && <View style={[styles.stepLine, STEPS.indexOf(step) > i && styles.stepLineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepIndicator />

        {step === 'amount' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            <View style={styles.quickGrid}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity key={a} style={[styles.quickBtn, amount === String(a) && styles.quickBtnActive]} onPress={() => setAmount(String(a))} activeOpacity={0.8}>
                  <Text style={[styles.quickBtnText, amount === String(a) && styles.quickBtnTextActive]}>₹{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Or Enter Amount</Text>
            <View style={styles.amtBox}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={Colors.text.muted} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Make Payment</Text>
            <View style={styles.payCard}>
              <Ionicons name="phone-portrait-outline" size={32} color={Colors.primary} />
              <Text style={styles.payTitle}>Pay via UPI</Text>
              <View style={styles.upiId}>
                <Text style={styles.upiText}>elite@upi</Text>
                <Ionicons name="copy-outline" size={18} color={Colors.text.secondary} />
              </View>
              <View style={styles.amtBadge}>
                <Text style={styles.amtBadgeText}>Amount: ₹{amount}</Text>
              </View>
              <Text style={styles.payNote}>Open any UPI app and send ₹{amount} to the above ID</Text>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('amount')} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setStep('confirm')} activeOpacity={0.85}>
                <Text style={styles.btnText}>I've Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirm Transaction</Text>
            <Text style={styles.label}>Transaction / UTR ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={utr}
                onChangeText={setUtr}
                placeholder="Enter UTR number from your UPI app"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                maxLength={16}
              />
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.status.info} />
              <Text style={styles.infoText}>Find your UTR/transaction ID in your UPI app's payment history. Your deposit will be credited within 30 minutes.</Text>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('payment')} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { flex: 1 }, loading && styles.disabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20, paddingBottom: 40 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.default },
  stepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDone: { backgroundColor: Colors.status.success, borderColor: Colors.status.success },
  stepNum: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  stepLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  stepLabelActive: { color: Colors.primary },
  stepLine: { flex: 1, height: 1, backgroundColor: Colors.border.default, marginHorizontal: 8, marginBottom: 18 },
  stepLineDone: { backgroundColor: Colors.status.success },
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  quickBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: Colors.primary },
  quickBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  quickBtnTextActive: { color: Colors.primary },
  amtBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 16, height: 56 },
  rupee: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary, marginRight: 8 },
  amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  backBtn: { height: 54, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  btnRow: { flexDirection: 'row', gap: 12 },
  payCard: { backgroundColor: Colors.background.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.primary + '44' },
  payTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  upiId: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background.elevated, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  upiText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  amtBadge: { backgroundColor: 'rgba(254,76,17,0.15)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  amtBadgeText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primary },
  payNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center', lineHeight: 18 },
  inputWrapper: { backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.status.info, lineHeight: 18 },
});
