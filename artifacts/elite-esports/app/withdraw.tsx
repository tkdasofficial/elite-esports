import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { submitWithdrawal } from '@/services/walletApi';
import { useWallet } from '@/store/WalletContext';
import { AdLoadingOverlay } from '@/components/AdLoadingOverlay';
import { useAdGate } from '@/hooks/useAdGate';
import { useAppSettings } from '@/hooks/useAppSettings';
import type { AppColors } from '@/utils/colors';

type Step = 'form' | 'processing' | 'error';

export default function WithdrawScreen() {
  const { balance, refreshWallet }           = useWallet();
  const { settings }                         = useAppSettings();
  const insets                               = useSafeAreaInsets();
  const { colors }                           = useTheme();
  const styles                               = useMemo(() => createStyles(colors), [colors]);

  const { gateWithInterstitial, overlay, dismiss } = useAdGate();

  const [amount, setAmount] = useState('');
  const [upiId,  setUpiId]  = useState('');
  const [step,   setStep]   = useState<Step>('form');
  const [error,  setError]  = useState('');

  const doSubmit = async (val: number, upi: string) => {
    setStep('processing');
    try {
      await submitWithdrawal(val, upi);
      await refreshWallet();
      router.replace('/(tabs)/wallet');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    const min = settings.min_withdraw;
    const max = Math.min(settings.max_withdraw, balance);
    if (!val || val < min)    { setError(`Minimum withdrawal is ₹${min}`);           setStep('error'); return; }
    if (val > balance)         { setError('You don\'t have enough balance');           setStep('error'); return; }
    if (val > max)             { setError(`Maximum withdrawal is ₹${max}`);           setStep('error'); return; }
    if (!upiId.trim())         { setError('Please enter your UPI ID');                setStep('error'); return; }
    if (!upiId.includes('@'))  { setError('Enter a valid UPI ID (e.g. name@bank)');   setStep('error'); return; }

    const upi = upiId.trim();
    gateWithInterstitial(() => doSubmit(val, upi));
  };

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Withdraw" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingTitle}>Processing…</Text>
          <Text style={styles.processingText}>Submitting your withdrawal request</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Withdraw" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        {/* Error Banner */}
        {step === 'error' && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Amount */}
        <Text style={styles.label}>Withdrawal Amount</Text>
        <View style={styles.amtBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.amtInput}
            value={amount}
            onChangeText={v => { setAmount(v); if (step === 'error') setStep('form'); }}
            placeholder="Enter amount"
            placeholderTextColor={colors.text.muted}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.hint}>Min ₹{settings.min_withdraw} · Max ₹{Math.min(settings.max_withdraw, balance).toFixed(0)}</Text>

        {/* UPI ID */}
        <Text style={[styles.label, { marginTop: 20 }]}>UPI ID</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="phone-portrait-outline" size={18} color={colors.text.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            value={upiId}
            onChangeText={v => { setUpiId(v); if (step === 'error') setStep('form'); }}
            placeholder="yourname@bank"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={15} color={colors.status.warning} />
          <Text style={styles.infoText}>
            Withdrawals are processed within 24–48 hours after admin approval.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdLoadingOverlay
        visible={overlay.visible}
        bypassAfter={overlay.duration}
        onSkip={dismiss}
        label={overlay.label}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:       { flex: 1, backgroundColor: colors.background.dark },
    scroll:          { padding: 20, paddingBottom: 40 },
    centerState:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    processingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    processingText:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    balanceCard:   { backgroundColor: colors.background.card, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '33', alignItems: 'center' },
    balanceLabel:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 4 },
    balanceAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', color: colors.text.primary },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.status.error, borderRadius: 12,
      padding: 14, marginBottom: 20,
    },
    errorText: { flex: 1, color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },

    label:        { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 8 },
    amtBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, height: 56, marginBottom: 6 },
    rupee:        { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary, marginRight: 8 },
    amtInput:     { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    hint:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginBottom: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 54 },
    input:        { flex: 1, color: colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },

    infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginTop: 16 },
    infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.status.warning, lineHeight: 18 },

    btn:     { backgroundColor: colors.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  });
}
