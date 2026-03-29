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
        ListHeaderComponent={
          <View>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#1C0800', '#0A0300', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                borderRadius={18}
              />
              <View style={styles.balanceCardInner}>
                <View style={styles.balanceTop}>
                  <View style={styles.walletIconBox}>
                    <Ionicons name="wallet" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                </View>
                <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/add-money')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Add Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnGhost]}
                    onPress={() => router.push('/withdraw')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-up" size={18} color={Colors.primary} />
                    <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* History link */}
            <TouchableOpacity
              style={styles.historyRow}
              onPress={() => router.push('/transaction-history')}
              activeOpacity={0.8}
            >
              <View style={styles.historyLeft}>
                <View style={styles.historyIconBox}>
                  <Ionicons name="receipt-outline" size={15} color={Colors.primary} />
                </View>
                <Text style={styles.historyLabel}>Full Transaction History</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.text.muted} />
            </TouchableOpacity>

            {transactions.length > 0 && (
              <Text style={styles.sectionTitle}>Recent</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <TransactionItem tx={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyText}>Add money to your wallet to get started</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16, gap: 0 },

  balanceCard: {
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.primary + '44',
    overflow: 'hidden',
  },
  balanceCardInner: {
    padding: 22,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  walletIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  balanceAmount: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginBottom: 24,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 48,
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary + '80',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.primary,
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  centered: { paddingTop: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.secondary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
