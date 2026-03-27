import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useWallet, Transaction } from '@/context/WalletContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

function TransactionItem({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'credit';
  const statusColors = {
    pending: Colors.status.warning,
    approved: Colors.status.success,
    rejected: Colors.status.error,
  };
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'} size={22} color={isCredit ? Colors.status.success : Colors.status.error} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <View style={styles.txMeta}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[tx.status] }]} />
          <Text style={[styles.txStatus, { color: statusColors[tx.status] }]}>{tx.status}</Text>
          <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? Colors.status.success : Colors.status.error }]}>
        {isCredit ? '+' : '-'}₹{tx.amount}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { balance, transactions, loading, refreshWallet } = useWallet();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Balance Card */}
            <LinearGradient colors={['#2A0900', '#1A0500']} style={styles.balanceCard}>
              <View style={styles.balanceCardInner}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/add-money')} activeOpacity={0.85}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Add Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => router.push('/withdraw')} activeOpacity={0.85}>
                    <Ionicons name="arrow-up-circle-outline" size={20} color={Colors.primary} />
                    <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/transaction-history')} activeOpacity={0.8}>
              <Text style={styles.historyBtnText}>Full Transaction History</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <TransactionItem tx={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={56} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyText}>Add money to get started</Text>
            </View>
          )
        }
        onRefresh={refreshWallet}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16, gap: 0 },
  balanceCard: { borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.primary + '55' },
  balanceCardInner: { padding: 24 },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  balanceAmount: { fontSize: 42, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, height: 46,
  },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background.card, borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  historyBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.card, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  txStatus: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
  txDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginLeft: 4 },
  txAmount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  separator: { height: 8 },
  centered: { padding: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
});
