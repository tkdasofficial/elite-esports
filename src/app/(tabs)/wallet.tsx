import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useWallet } from '@/store/WalletContext';
import { TransactionItem } from '@/features/wallet/components/TransactionItem';

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
        onRefresh={refreshWallet}
        refreshing={loading}
        scrollEnabled
        ListHeaderComponent={
          <View>
            <LinearGradient colors={['#2A0900', '#1A0500']} style={styles.balanceCard}>
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
            </LinearGradient>

            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/transaction-history')} activeOpacity={0.8}>
              <Text style={styles.historyBtnText}>Full Transaction History</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
        }
        renderItem={({ item }) => <TransactionItem tx={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={56} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyText}>Add money to get started</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16 },
  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: Colors.primary + '55' },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  balanceAmount: { fontSize: 42, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, height: 46 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.background.card, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border.default },
  historyBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 12 },
  centered: { padding: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
});
