import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
type Step = 'amount' | 'payment' | 'confirm';

export default function AddMoneyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('amount');

  const handleNext = () => {
    const val = parseFloat(amount);
    if (!val || val < 10) { Alert.alert('Invalid', 'Minimum deposit is ₹10'); return; }
    setStep('payment');
  };

  const handleSubmit = async () => {
    if (!utr.trim()) { Alert.alert('Required', 'Please enter transaction ID'); return; }
    setLoading(true);
    const { error } = await supabase.from('payments').insert({
      user_id: user?.id, amount: parseFloat(amount),
      utr: utr.trim(), status: 'pending',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Submitted!', 'Deposit request is pending review.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const STEPS: Step[] = ['amount', 'payment', 'confirm'];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Add Money" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]} showsVerticalScrollIndicator={false}>
        <View style={styles.steps}>
          {['Amount', 'Payment', 'Confirm'].map((label, i) => (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step === STEPS[i] && styles.stepActive]}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{label}</Text>
              </View>
              {i < 2 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

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
              <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} placeholder="Enter amount" placeholderTextColor={colors.text.muted} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.payCard}>
              <Ionicons name="phone-portrait-outline" size={32} color={colors.primary} />
              <Text style={styles.payTitle}>Pay via UPI</Text>
              <View style={styles.upiId}>
                <Text style={styles.upiText}>elite@upi</Text>
                <Ionicons name="copy-outline" size={18} color={colors.text.secondary} />
              </View>
              <View style={styles.amtBadge}>
                <Text style={styles.amtBadgeText}>Amount: ₹{amount}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => setStep('confirm')} activeOpacity={0.85}>
              <Text style={styles.btnText}>I've Made the Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirm Transaction</Text>
            <Text style={styles.label}>Transaction / UTR ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={utr} onChangeText={setUtr} placeholder="12-digit UTR number" placeholderTextColor={colors.text.muted} keyboardType="numeric" maxLength={12} />
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.status.info} />
              <Text style={styles.infoText}>Your deposit will be verified and credited within 30 minutes</Text>
            </View>
            <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 20, paddingBottom: 40 },
    steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    stepItem: { alignItems: 'center', gap: 6 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border.default },
    stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNum: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
    stepLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted },
    stepLine: { flex: 1, height: 1, backgroundColor: colors.border.default, marginHorizontal: 8, marginBottom: 18 },
    section: { gap: 16 },
    sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.default },
    quickBtnActive: { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: colors.primary },
    quickBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    quickBtnTextActive: { color: colors.primary },
    amtBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, height: 56 },
    rupee: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary, marginRight: 8 },
    amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    btn: { backgroundColor: colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    disabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
    payCard: { backgroundColor: colors.background.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.primary + '44' },
    payTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    upiId: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background.elevated, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    upiText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    amtBadge: { backgroundColor: 'rgba(254,76,17,0.15)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    amtBadgeText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.primary },
    inputWrapper: { backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 52, justifyContent: 'center' },
    input: { color: colors.text.primary, fontSize: 16, fontFamily: 'Inter_500Medium' },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
    infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.status.info, lineHeight: 18 },
  });
}
