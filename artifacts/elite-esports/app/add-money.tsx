import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { submitDeposit } from '@/services/walletApi';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 2000, 5000];

type Step = 'amount' | 'payment' | 'confirm' | 'processing' | 'success' | 'error';

function buildUpiString(upiId: string, amount: string): string {
  const amtNum = parseFloat(amount);
  return (
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent('Elite eSports')}` +
    `&am=${amtNum.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent('Wallet Deposit')}`
  );
}

export default function AddMoneyScreen() {
  const insets                    = useSafeAreaInsets();
  const { colors }                = useTheme();
  const styles                    = useMemo(() => createStyles(colors), [colors]);
  const { settings, loading: settingsLoading } = useAppSettings();
  const { user }                  = useAuth();

  const kycDone = user?.user_metadata?.kyc_completed === true;

  const [amount, setAmount] = useState('');
  const [utr,    setUtr]    = useState('');
  const [step,   setStep]   = useState<Step>('amount');
  const [error,  setError]  = useState('');

  const upiId = settings.upi_id;

  const handleNext = () => {
    const val = parseFloat(amount);
    const min = settings.min_deposit;
    const max = settings.max_deposit;
    if (!val || val < min) { setError(`Minimum deposit is ₹${min}`); setStep('error'); return; }
    if (val > max)          { setError(`Maximum deposit is ₹${max}`); setStep('error'); return; }
    if (!upiId)             { setError('Payment details not available. Please try again.'); setStep('error'); return; }
    setError('');
    setStep('payment');
  };

  const handleSubmit = async () => {
    if (!utr.trim()) { setError('Please enter your Transaction / UTR ID'); setStep('error'); return; }
    setStep('processing');
    try {
      await submitDeposit(parseFloat(amount), utr.trim());
      setStep('success');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const copyUpi = useCallback(async () => {
    if (!upiId) return;
    await Clipboard.setStringAsync(upiId);
    Alert.alert('Copied!', 'UPI ID copied to clipboard.');
  }, [upiId]);

  const STEPS: Step[] = ['amount', 'payment', 'confirm'];
  const STEP_LABELS: Record<Step, string> = {
    amount: 'Amount', payment: 'QR Pay', confirm: 'Confirm',
    processing: 'Confirm', success: 'Confirm', error: 'Amount',
  };
  const stepLabel = (s: Step) => STEP_LABELS[s] ?? s;

  const StepIndicator = (
    <View style={styles.steps}>
      {(['amount', 'payment', 'confirm'] as const).map((s, i) => {
        const isDone   = STEPS.indexOf(step) > i || step === 'success' || step === 'processing';
        const isActive = step === s || (step === 'processing' && i === 2) || (step === 'error' && STEPS.indexOf(step as any) >= i);
        return (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, isActive && styles.stepActive]}>
                {isDone && !isActive
                  ? <Ionicons name="checkmark" size={18} color="#fff" />
                  : <Text style={styles.stepNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, isActive && { color: colors.primary }]}>{stepLabel(s)}</Text>
            </View>
            {i < 2 && <View style={[styles.stepLine, isDone && { backgroundColor: colors.primary }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );

  if (!kycDone) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Add Money" />
        <View style={styles.centerState}>
          <View style={styles.kycIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={54} color={colors.primary} />
          </View>
          <Text style={styles.kycTitle}>Profile Verification Required</Text>
          <Text style={styles.kycBody}>
            You need to complete your profile setup before you can add money to your wallet.
          </Text>
          <TouchableOpacity style={styles.kycBtn} onPress={() => router.push('/(auth)/kyc')} activeOpacity={0.85}>
            <Text style={styles.kycBtnText}>Complete Profile</Text>
            <Ionicons name="arrow-forward" size={21} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (settingsLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Add Money" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>Loading payment details…</Text>
        </View>
      </View>
    );
  }

  if (!upiId && !settingsLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Add Money" />
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={54} color={colors.status.warning} />
          <Text style={styles.processingTitle}>Temporarily Unavailable</Text>
          <Text style={styles.processingText}>
            Payment details could not be loaded.{'\n'}Please try again in a moment.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Add Money" />
        <View style={styles.centerState}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
          </View>
          <Text style={styles.processingTitle}>Request Submitted!</Text>
          <Text style={styles.processingText}>
            Your deposit of ₹{amount} has been submitted.{'\n'}
            It will be credited after admin approval (within 30 min).
          </Text>
          <TouchableOpacity
            style={[styles.btn, { marginTop: 32, paddingHorizontal: 32 }]}
            onPress={() => router.replace('/(tabs)/wallet')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Go to Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Add Money" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
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

        {/* ───────────── STEP 1 — Amount ───────────── */}
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

            <Text style={styles.label}>Or Enter Custom Amount</Text>
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

            {amount ? (
              <View style={styles.amtSummary}>
                <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                <Text style={styles.amtSummaryText}>₹{amount} will be added to your wallet</Text>
              </View>
            ) : null}

            <View style={styles.upiPreviewRow}>
              <Ionicons name="qr-code-outline" size={18} color={colors.text.muted} />
              <Text style={styles.upiPreviewText}>Pay to: <Text style={{ color: colors.primary }}>{upiId}</Text></Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Next — Scan &amp; Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ───────────── STEP 2 — QR Code Payment ───────────── */}
        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan &amp; Pay</Text>

            <View style={styles.amtPill}>
              <Ionicons name="cash-outline" size={21} color={colors.primary} />
              <Text style={styles.amtPillText}>Pay exactly ₹{amount}</Text>
            </View>

            {/* QR Code — generated from live backend UPI ID */}
            <View style={styles.qrCard}>
              <View style={styles.qrLabelRow}>
                <Ionicons name="qr-code-outline" size={21} color={colors.text.muted} />
                <Text style={styles.qrLabel}>Scan with any UPI app</Text>
              </View>

              <View style={styles.qrWrapper}>
                <QRCode
                  value={buildUpiString(upiId, amount)}
                  size={220}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  quietZone={10}
                />
              </View>

              <View style={styles.qrHintRow}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.text.muted} />
                <Text style={styles.qrHint}>
                  Google Pay · PhonePe · Paytm · BHIM or any UPI app
                </Text>
              </View>
            </View>

            {/* UPI ID — live from backend */}
            <View style={styles.upiRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiLabel}>UPI ID</Text>
                <Text style={styles.upiValue}>{upiId}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyUpi} activeOpacity={0.75}>
                <Ionicons name="copy-outline" size={21} color={colors.primary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={21} color="#F59E0B" />
              <Text style={styles.warningText}>
                Pay the <Text style={{ fontFamily: 'Inter_700Bold' }}>exact amount ₹{amount}</Text> — do not change the amount when scanning.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setStep('confirm')}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>I've Made the Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('amount')}>
              <Text style={styles.backLinkText}>← Change amount</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ───────────── STEP 3 — Confirm UTR ───────────── */}
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

            <View style={styles.depositSummary}>
              <View style={styles.depositSummaryRow}>
                <Text style={styles.depositSummaryLabel}>Amount</Text>
                <Text style={styles.depositSummaryValue}>₹{amount}</Text>
              </View>
              <View style={styles.depositSummaryRow}>
                <Text style={styles.depositSummaryLabel}>Paid to UPI</Text>
                <Text style={[styles.depositSummaryValue, { color: colors.text.secondary, fontSize: 13 }]}>{upiId}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={20} color={colors.status.info} />
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
    container:       { flex: 1, backgroundColor: colors.background.dark },
    scroll:          { padding: 20 },
    centerState:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
    successIcon:     { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
    processingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    processingText:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 22 },

    kycIconWrap: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: colors.primary + '18',
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    kycTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    kycBody:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
    kycBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 30, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
    kycBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

    steps:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    stepItem:   { alignItems: 'center', gap: 6 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border.default },
    stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNum:    { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
    stepLabel:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted },
    stepLine:   { flex: 1, height: 1, backgroundColor: colors.border.default, marginHorizontal: 8, marginBottom: 18 },

    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.status.error, borderRadius: 12, padding: 14, marginBottom: 20 },
    errorText:   { flex: 1, color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },

    section:      { gap: 16 },
    sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    label:        { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary },

    quickGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn:           { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.default },
    quickBtnActive:     { backgroundColor: 'rgba(254,76,17,0.15)', borderColor: colors.primary },
    quickBtnText:       { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    quickBtnTextActive: { color: colors.primary },

    amtBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, height: 56 },
    rupee:    { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary, marginRight: 8 },
    amtInput: { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary },

    amtSummary:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary + '12', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary + '30' },
    amtSummaryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    upiPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    upiPreviewText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    amtPill:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary + '15', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center', borderWidth: 1, borderColor: colors.primary + '40' },
    amtPillText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },

    qrCard:    { backgroundColor: colors.background.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primary + '33', alignItems: 'center', gap: 14 },
    qrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    qrLabel:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    qrWrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    qrHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qrHint:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', flex: 1 },

    upiRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, paddingVertical: 14 },
    upiLabel:    { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.7 },
    upiValue:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.primary },
    copyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '18', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + '40' },
    copyBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    warningBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
    warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#F59E0B', lineHeight: 20 },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 52 },
    input:        { flex: 1, color: colors.text.primary, fontSize: 16, fontFamily: 'Inter_500Medium' },

    depositSummary:      { backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden' },
    depositSummaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
    depositSummaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    depositSummaryValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary },

    infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
    infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.status.info, lineHeight: 18 },

    btn:      { backgroundColor: colors.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
    btnText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

    backLink:     { alignItems: 'center', paddingVertical: 8 },
    backLinkText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.muted },
  });
}
