import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { usePlatformStore } from '@/src/store/platformStore';
import { Colors } from '@/src/theme/colors';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const { user, transactions, addTransaction } = useUserStore();
  const { settings } = usePlatformStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showWith, setShowWith] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [utr, setUtr] = useState('');
  const [method, setMethod] = useState<'upi' | 'giftcard'>('upi');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const [loading, setLoading] = useState(false);

  const ADMIN_UPI = settings.upiId || 'admin@upi';

  const deposited = transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((a, t) => a + t.amount, 0);
  const winnings = transactions.filter(t => t.type === 'win' && t.status === 'success').reduce((a, t) => a + t.amount, 0);

  const handleAddCash = () => {
    if (Number(amount) < 10) { Alert.alert('Minimum ₹10'); return; }
    setStep(2);
  };

  const submitDeposit = async () => {
    if (!utr) { Alert.alert('Enter Transaction ID'); return; }
    setLoading(true);
    await addTransaction({ type: 'deposit', amount: Number(amount), status: 'pending', method: 'upi', details: utr, title: 'Deposit Request' });
    setLoading(false);
    setStatus('success');
    setTimeout(() => { setShowAdd(false); setStep(1); setAmount(''); setUtr(''); setStatus('idle'); }, 2200);
  };

  const handleWithdraw = async () => {
    const n = Number(amount);
    if (n < 50) { Alert.alert('Minimum ₹50'); return; }
    if (n > (user?.coins || 0)) { Alert.alert('Insufficient balance'); return; }
    if (!details) { Alert.alert(`Enter ${method === 'upi' ? 'UPI ID' : 'Email'}`); return; }
    setLoading(true);
    await addTransaction({ type: 'withdrawal', amount: -n, status: 'pending', method, details, title: `${method === 'upi' ? 'UPI' : 'Gift Card'} Withdrawal` });
    setLoading(false);
    setStatus('success');
    setTimeout(() => { setShowWith(false); setAmount(''); setDetails(''); setStatus('idle'); }, 2200);
  };

  const txColor = (tx: any) => tx.amount > 0 ? Colors.brandSuccess : Colors.brandLive;
  const txIcon = (type: string) => {
    if (type === 'deposit') return 'add-circle';
    if (type === 'win') return 'trophy';
    if (type === 'withdrawal') return 'arrow-up-circle';
    return 'game-controller';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <View style={styles.balanceContent}>
            <View style={styles.balanceTop}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>₹{user?.coins || 0}</Text>
              </View>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet" size={22} color={Colors.white} />
              </View>
            </View>
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <View style={styles.balanceStatHeader}>
                  <Ionicons name="arrow-down-circle" size={12} color={Colors.brandSuccess} />
                  <Text style={styles.balanceStatLabel}>DEPOSITED</Text>
                </View>
                <Text style={styles.balanceStatValue}>₹{deposited}</Text>
              </View>
              <View style={styles.balanceStat}>
                <View style={styles.balanceStatHeader}>
                  <Ionicons name="trending-up" size={12} color={Colors.brandWarning} />
                  <Text style={styles.balanceStatLabel}>WINNINGS</Text>
                </View>
                <Text style={styles.balanceStatValue}>₹{winnings}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>Add Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWith(true)}>
            <Ionicons name="arrow-up" size={18} color={Colors.textPrimary} />
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <View style={styles.txSection}>
          <View style={styles.txHeader}>
            <Text style={styles.txTitle}>Transactions</Text>
            {transactions.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.slice(0, 5).map((tx, i) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: `${txColor(tx)}20` }]}>
                    <Ionicons name={txIcon(tx.type) as any} size={18} color={txColor(tx)} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>{tx.title || tx.type}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.brandSuccess : Colors.textPrimary }]}>
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                    </Text>
                    <Text style={[styles.txStatus,
                      tx.status === 'success' ? styles.txSuccess : tx.status === 'pending' ? styles.txPending : styles.txFailed
                    ]}>{tx.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Cash Modal */}
      <Modal visible={showAdd} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Cash</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAdd(false)}>
                  <Ionicons name="close" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {status === 'success' ? (
                <View style={styles.successBox}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={48} color={Colors.brandSuccess} />
                  </View>
                  <Text style={styles.successTitle}>Request Submitted!</Text>
                  <Text style={styles.successText}>Admin will verify and add funds shortly.</Text>
                </View>
              ) : step === 1 ? (
                <View style={styles.formGap}>
                  <Text style={styles.fieldLabel}>Enter Amount (Min ₹10)</Text>
                  <View style={styles.amountInputRow}>
                    <Text style={styles.rupee}>₹</Text>
                    <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
                  </View>
                  <View style={styles.quickAmounts}>
                    {[50, 100, 200, 500].map(v => (
                      <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setAmount(v.toString())}>
                        <Text style={styles.quickBtnText}>+₹{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCash}>
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.formGap}>
                  <View style={styles.upiCard}>
                    <View>
                      <Text style={styles.upiLabel}>Pay via UPI</Text>
                      <Text style={styles.upiId}>{ADMIN_UPI}</Text>
                    </View>
                    <TouchableOpacity style={styles.copyBtn} onPress={() => { Clipboard.setStringAsync(ADMIN_UPI).then(() => Alert.alert('Copied!')); }}>
                      <Ionicons name="copy" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldLabel}>Transaction ID (UTR)</Text>
                  <TextInput style={styles.fieldInput} value={utr} onChangeText={setUtr} placeholder="Enter 12-digit UTR" placeholderTextColor={Colors.textMuted} />
                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, styles.flex2, loading && styles.disabled]} onPress={submitDeposit} disabled={loading}>
                      {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Submit</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWith} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowWith(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdraw</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowWith(false)}>
                  <Ionicons name="close" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {status === 'success' ? (
                <View style={styles.successBox}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={48} color={Colors.brandSuccess} />
                  </View>
                  <Text style={styles.successTitle}>Withdrawal Requested!</Text>
                  <Text style={styles.successText}>Funds sent within 24 hours.</Text>
                </View>
              ) : (
                <View style={styles.formGap}>
                  <Text style={styles.fieldLabel}>Method</Text>
                  <View style={styles.methodRow}>
                    {(['upi', 'giftcard'] as const).map(m => (
                      <TouchableOpacity key={m} style={[styles.methodBtn, method === m && styles.methodBtnActive]} onPress={() => setMethod(m)}>
                        <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>{m === 'upi' ? 'UPI Transfer' : 'Google Play'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.fieldLabel}>Amount (Min ₹50)</Text>
                  <View style={styles.amountInputRow}>
                    <Text style={styles.rupee}>₹</Text>
                    <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
                  </View>
                  <Text style={styles.availableText}>Available: ₹{user?.coins || 0}</Text>
                  <Text style={styles.fieldLabel}>{method === 'upi' ? 'UPI ID' : 'Email'}</Text>
                  <TextInput style={styles.fieldInput} value={details} onChangeText={setDetails} placeholder={method === 'upi' ? 'example@upi' : 'your@email.com'} placeholderTextColor={Colors.textMuted} />
                  <View style={styles.warningBox}>
                    <Ionicons name="warning-outline" size={16} color={Colors.brandWarning} />
                    <Text style={styles.warningText}>Withdrawals are processed manually and may take up to 24 hours.</Text>
                  </View>
                  <TouchableOpacity style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleWithdraw} disabled={loading}>
                    {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Withdraw Now</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  balanceCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 16,
    backgroundColor: '#0f3460',
  },
  balanceGlow: {
    position: 'absolute', top: -48, right: -48, width: 192, height: 192,
    backgroundColor: `${Colors.brandPrimary}15`, borderRadius: 96,
  },
  balanceContent: { padding: 24, gap: 20 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginBottom: 6 },
  balanceAmount: { fontSize: 40, fontWeight: '700', color: Colors.white, letterSpacing: -1 },
  balanceIcon: {
    width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceStats: { flexDirection: 'row', gap: 12 },
  balanceStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  balanceStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 0.5 },
  balanceStatValue: { fontSize: 15, fontWeight: '600', color: Colors.white },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, backgroundColor: Colors.brandPrimary, borderRadius: 12,
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  withdrawBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, backgroundColor: Colors.appElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  withdrawBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txSection: { gap: 12 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.3 },
  viewAll: { fontSize: 15, color: Colors.brandPrimary },
  emptyTx: { paddingVertical: 40, backgroundColor: Colors.appCard, borderRadius: 16, alignItems: 'center' },
  emptyTxText: { fontSize: 15, color: Colors.textMuted },
  txList: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, color: Colors.textPrimary },
  txDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '600' },
  txStatus: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  txSuccess: { color: Colors.brandSuccess },
  txPending: { color: Colors.brandWarning },
  txFailed: { color: Colors.brandLive },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: Colors.appCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  handle: { width: 40, height: 5, backgroundColor: Colors.appElevated, borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  closeBtn: { width: 32, height: 32, backgroundColor: Colors.appElevated, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  successBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  successIcon: { marginBottom: 4 },
  successTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  formGap: { gap: 14 },
  fieldLabel: { fontSize: 14, color: Colors.textSecondary },
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.appFill, borderRadius: 12, paddingHorizontal: 16, height: 52,
  },
  rupee: { fontSize: 20, fontWeight: '600', color: Colors.textMuted, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  quickAmounts: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, paddingVertical: 10, backgroundColor: Colors.appElevated, borderRadius: 10, alignItems: 'center' },
  quickBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  primaryBtn: {
    height: 52, backgroundColor: Colors.brandPrimary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  upiCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: `${Colors.brandPrimary}15`, borderRadius: 14,
  },
  upiLabel: { fontSize: 12, color: Colors.brandPrimaryLight, marginBottom: 4, fontWeight: '500' },
  upiId: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  copyBtn: { width: 36, height: 36, backgroundColor: Colors.brandPrimary, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fieldInput: {
    height: 48, backgroundColor: Colors.appFill, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary,
  },
  rowBtns: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1, height: 52, backgroundColor: Colors.appElevated,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  secondaryBtnText: { fontSize: 15, color: Colors.textPrimary },
  flex2: { flex: 2 },
  disabled: { opacity: 0.4 },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: { flex: 1, paddingVertical: 14, backgroundColor: Colors.appElevated, borderRadius: 12, alignItems: 'center' },
  methodBtnActive: { backgroundColor: Colors.brandPrimary },
  methodBtnText: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  methodBtnTextActive: { color: Colors.white },
  availableText: { fontSize: 13, color: Colors.textMuted },
  warningBox: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: `${Colors.brandWarning}12`, borderRadius: 12, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 13, color: `${Colors.brandWarning}CC`, lineHeight: 18 },
});
