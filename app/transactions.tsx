import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const { transactions } = useUserStore();

  const txIcon = (type: string) => {
    if (type === 'deposit') return 'add-circle';
    if (type === 'win') return 'trophy';
    if (type === 'withdrawal') return 'arrow-up-circle';
    return 'game-controller';
  };

  const txColor = (amount: number) => amount > 0 ? Colors.brandSuccess : Colors.brandLive;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 22 }} />
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptyText}>Your transaction history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const color = txColor(item.amount);
            return (
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: `${color}20` }]}>
                  <Ionicons name={txIcon(item.type) as any} size={18} color={color} />
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
                    item.status === 'success' ? styles.success : item.status === 'pending' ? styles.pending : styles.failed
                  ]}>{item.status}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  list: { paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  txTitle: { fontSize: 15, color: Colors.textPrimary, textTransform: 'capitalize' },
  txDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '600' },
  txStatus: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  success: { color: Colors.brandSuccess },
  pending: { color: Colors.brandWarning },
  failed: { color: Colors.brandLive },
  sep: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 70 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
