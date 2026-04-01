import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { submitWithdrawal } from '@/services/walletApi';
import { useWallet } from '@/store/WalletContext';
import { AdLoadingOverlay } from '@/components/AdLoadingOverlay';
import { useAdGate } from '@/hooks/useAdGate';
import { useAds } from '@/store/AdContext';
import type { AppColors } from '@/utils/colors';

export default function WithdrawScreen() {
  const { balance, refreshWallet } = useWallet();
  const insets                     = useSafeAreaInsets();
  const { adConfig }               = useAds();
  const { gateAction, overlay, dismiss } = useAdGate();
  const { colors }                 = useTheme();
  const styles                     = useMemo(() => createStyles(colors), [colors]);

  const [amount,  setAmount]  = useState('');
  const [upiId,   setUpiId]   = useState('');
  const [loading, setLoading] = useState(false);

  const doSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await submitWithdrawal(parseFloat(amount), upiId.trim());
      await refreshWallet();
      Alert.alert(
        'Requested!',
        'Your withdrawal is being processed. Funds will be sent to your UPI ID within 24–48 hours.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [amount, upiId, refreshWallet]);

  const handleSubmit = useCallback(() => {
    const val = parseFloat(amount);
    if (!val || val < 50)  { Alert.alert('Invalid', 'Minimum withdrawal is ₹50'); return; }
    if (val > balance)      { Alert.alert('Insufficient', 'Not enough balance'); return; }
    if (!upiId.trim())      { Alert.alert('Required', 'Please enter your UPI ID'); return; }

    gateAction(adConfig.withdraw, doSubmit, 'Loading Reward Ad...');
  }, [amount, balance, upiId, adConfig.withdraw, gateAction, doSubmit]);

  return (
    <View style={styles.container}>
      <AdLoadingOverlay
        visible={overlay.visible}
        bypassAfter={overlay.duration}
        onSkip={dismiss}
        label={overlay.label}
      />

      <ScreenHeader title="Withdraw" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Withdrawal Amount</Text>
        <View style={styles.amtBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.amtInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor={colors.text.muted}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.hint}>Minimum withdrawal: ₹50</Text>

        <Text style={[styles.label, { marginTop: 20 }]}>UPI ID</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="phone-portrait-outline" size={18} color={colors.text.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            value={upiId}
            onChangeText={setUpiId}
            placeholder="yourname@bank"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {adConfig.withdraw.enabled && (
          <View style={styles.adNote}>
            <Ionicons name="play-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.adNoteText}>Watch a short ad to complete your withdrawal</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={16} color={colors.status.warning} />
          <Text style={styles.infoText}>Withdrawals are processed within 24–48 hours</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || overlay.visible) && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading || overlay.visible}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Request Withdrawal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background.dark },
    scroll:       { padding: 20, paddingBottom: 40 },
    balanceCard:  { backgroundColor: colors.background.card, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '33', alignItems: 'center' },
    balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 6 },
    balanceAmount:{ fontSize: 36, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    label:        { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.secondary, marginBottom: 8 },
    amtBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, height: 56, marginBottom: 6 },
    rupee:        { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary, marginRight: 8 },
    amtInput:     { flex: 1, fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    hint:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 14, height: 54 },
    input:        { flex: 1, color: colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
    adNote:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary + '11', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.primary + '33', marginTop: 16 },
    adNoteText:   { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.primary, lineHeight: 18 },
    infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginTop: 16 },
    infoText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.status.warning, lineHeight: 18 },
    btn:          { backgroundColor: colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    disabled:     { opacity: 0.6 },
    btnText:      { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  });
}
