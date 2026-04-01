import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { submitDeposit } from '@/services/walletApi';
import type { AppColors } from '@/utils/colors';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
type Step = 'amount' | 'payment' | 'confirm' | 'processing' | 'error';

export default function AddMoneyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [amount, setAmount]   = useState('');
  const [utr,    setUtr]      = useState('');
  const [step,   setStep]     = useState<Step>('amount');
  const [error,  setError]    = useState('');

  const handleNext = () => {
    const val = parseFloat(amount);
    if (!val || val < 10) { setError('Minimum deposit is ₹10'); setStep('error'); return; }
    setError('');
    setStep('payment');
  };

  const handleSubmit = async () => {
    if (!utr.trim()) { setError('Please enter your Transaction / UTR ID'); setStep('error'); return; }
    setStep('processing');
    try {
      await submitDeposit(parseFloat(amount), utr.trim());
      router.replace('/(tabs)/wallet');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const STEPS: Step[] = ['amount', 'payment', 'confirm'];

  const StepIndicator = (
    <View style={styles.steps}>
      {(['amount', 'payment', 'confirm'] as const).map((s, i) => {
        const labels = ['Amount', 'Payment', 'Confirm'];
        const active = step === s || (step === 'processing' && i === 2) || (step === 'error' && STEPS.indexOf(step as any) >= i);
        return (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepActive]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{labels[i]}</Text>
            </View>
            {i < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Add Money" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingTitle}>Processing…</Text>
          <Text style={styles.processingText}>Submitting your deposit request</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Add Money" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        {StepIndicator}

        {/* Error Banner */}
        {step === 'error' && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* STEP 1 — Amount */}
        {(step === 'amount' || step === 'error') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            <View style={styles.quickGrid}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickBtn, amount === String(a) && styles.quickBtnActive]}
                  onPress={() => { setAmount(String(a)); setStep('amount'); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickBtnText, amount === String(a) && styles.quickBtnTextActive]}>
                    ₹{a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Or Enter Amount</Text>
            <View style={styles.amtBox}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amtInput}
                value={amount}
                onChangeText={v => { setAmount(v); setStep('amount'); }}
                placeholder="Enter amount"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 — Payment */}
        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pay to Admin</Text>
            <View style={styles.payCard}>
              <Ionicons name="phone-portrait-outline" size={36} color={colors.primary} />
              <Text style={styles.payTitle}>Pay via UPI</Text>
              <View style={styles.upiRow}>
                <Text style={styles.upiText}>elite@upi</Text>
                <Ionicons name="copy-outline" size={18} color={colors.text.secondary} />
              </View>
              <View style={styles.amtBadge}>
                <Text style={styles.amtBadgeText}>₹{amount}</Text>
              </View>
              <Text style={styles.payNote}>
                Open any UPI app, pay the exact amount to the ID above, then tap the button below.
              </Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => setStep('confirm')} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>I've Made the Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('amount')}>
              <Text style={styles.backLinkText}>← Change amount</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3 — Confirm UTR */}
        {step === 'confirm' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter UTR Number</Text>
            <Text style={styles.label}>Transaction / UTR ID</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="receipt-outline" size={18} color={colors.text.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                value={utr}
                onChangeText={setUtr}
                placeholder="12-digit UTR number"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
                maxLength={12}
                autoFocus
              />
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={15} color={colors.status.info} />
              <Text style={styles.infoText}>
                Your deposit will be verified and credited within 30 minutes after admin approval.
              </Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.btnText}>Submit Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('payment')}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background.dark },
    scroll:      { padding: 20, paddingBottom: 40 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    processingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    processingText:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    steps:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    stepItem:   { alignItems: 'center', gap: 6 },
    stepCircle: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.background.elevated, alignItems: 'center',
      justifyContent: 'center', borderWidth: 1, borderColor: colors.border.default,
    },
    stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNum:    { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
    stepLabel:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted },
    stepLine:   { flex: 1, height: 1, backgroundColor: colors.border.default, marginHorizontal: 8, marginBottom: 18 },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.status.error, borderRadius: 12,
      padding: 14, marginBottom: 20,
    },
    errorText: { flex: 1, color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },

    section:      { gap: 16 },
    sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    label:        { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary },

    quickGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn:         { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.default },
    quickBtnActive:   { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: colors.primary },
    quickBtnText:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    quickBtnTextActive: { color: colors.primary },

    amtBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, height: 56 },
    rupee:    { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary, marginRight: 8 },
    amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary },

    payCard: {
      backgroundColor: colors.background.card, borderRadius: 16, padding: 24,
      alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.primary + '44',
    },
    payTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    upiRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background.elevated, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    upiText:  { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    amtBadge: { backgroundColor: 'rgba(254,76,17,0.15)', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
    amtBadgeText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
    payNote:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 18 },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 52 },
    input:        { flex: 1, color: colors.text.primary, fontSize: 16, fontFamily: 'Inter_500Medium' },

    infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
    infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.status.info, lineHeight: 18 },

    btn: {
      backgroundColor: colors.primary, borderRadius: 14, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, marginTop: 4,
    },
    btnText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
    backLink: { alignItems: 'center', paddingVertical: 8 },
    backLinkText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.muted },
  });
}
