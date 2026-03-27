import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { useWallet, Transaction } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS = {
  pending: Colors.status.warning,
  approved: Colors.status.success,
  rejected: Colors.status.error,
};

function TxItem({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'credit';
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={18} color={isCredit ? Colors.status.success : Colors.status.error} />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>{tx.description}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[tx.status] }]} />
          <Text style={[styles.status, { color: STATUS_COLORS[tx.status] }]}>{tx.status}</Text>
          <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isCredit ? Colors.status.success : Colors.status.error }]}>
        {isCredit ? '+' : '-'}₹{tx.amount}
      </Text>
    </View>
  );
}

export default function TransactionHistoryScreen() {
  const { transactions, loading, refreshWallet } = useWallet();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TxItem tx={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>Your transaction history will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onRefresh={refreshWallet}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.background.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.subtle },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  desc: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginLeft: 4 },
  amount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sep: { height: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
