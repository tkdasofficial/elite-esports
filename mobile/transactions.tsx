import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

type TxFilter = 'all' | 'deposit' | 'withdrawal' | 'win' | 'entry';

const FILTER_LABELS: Record<TxFilter, string> = {
  all: 'All',
  deposit: 'Deposits',
  withdrawal: 'Withdrawals',
  win: 'Winnings',
  entry: 'Entry Fees',
};

const FILTERS: TxFilter[] = ['all', 'deposit', 'withdrawal', 'win', 'entry'];

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const { transactions } = useUserStore();
  const [activeFilter, setActiveFilter] = useState<TxFilter>('all');

  const filtered = activeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === activeFilter);

  const totalIn  = transactions.filter(t => t.amount > 0  && t.status === 'success').reduce((a, t) => a + t.amount, 0);
  const totalOut = transactions.filter(t => t.amount < 0  && t.status === 'success').reduce((a, t) => a + t.amount, 0);

  const txIcon = (type: string) => {
    if (type === 'deposit')    return 'add-circle';
    if (type === 'win')        return 'trophy';
    if (type === 'withdrawal') return 'arrow-up-circle';
    return 'game-controller';
  };

  const txColors = (type: string, amount: number) => {
    if (amount > 0)            return { bg: `${Colors.brandSuccess}20`, icon: Colors.brandSuccess };
    if (type === 'withdrawal') return { bg: `${Colors.brandLive}20`,    icon: Colors.brandLive };
    return { bg: Colors.appElevated, icon: Colors.textSecondary };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.count}>{filtered.length} records</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Text style={styles.summaryLabel}>Total In</Text>
          <Text style={[styles.summaryValue, { color: Colors.brandSuccess }]}>+₹{totalIn.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Text style={styles.summaryLabel}>Total Out</Text>
          <Text style={[styles.summaryValue, { color: Colors.brandLive }]}>₹{Math.abs(totalOut).toLocaleString()}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={28} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptyText}>
            No {activeFilter === 'all' ? '' : FILTER_LABELS[activeFilter].toLowerCase()} found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const { bg, icon } = txColors(item.type, item.amount);
            return (
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                  <Ionicons name={txIcon(item.type) as any} size={18} color={icon} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.txTitle}>{item.title || item.type}</Text>
                  <Text style={styles.txDate}>{item.date}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.txAmount, { color: item.amount > 0 ? Colors.brandSuccess : Colors.textPrimary }]}>
                    {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount)}
                  </Text>
                  <Text style={[
                    styles.txStatus,
                    item.status === 'success' ? styles.statusSuccess
                      : item.status === 'pending' ? styles.statusPending
                      : styles.statusFailed,
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textMuted },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  summaryCard: { backgroundColor: Colors.appCard, borderRadius: 14, padding: 14, gap: 4 },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.appElevated },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 32, backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden', marginHorizontal: 16 },
  sep: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 70 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  txTitle: { fontSize: 15, color: Colors.textPrimary, textTransform: 'capitalize' },
  txDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '600' },
  txStatus: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  statusSuccess: { color: Colors.brandSuccess },
  statusPending: { color: Colors.brandWarning },
  statusFailed: { color: Colors.brandLive },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { width: 72, height: 72, backgroundColor: Colors.appCard, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
