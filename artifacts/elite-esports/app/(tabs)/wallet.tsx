import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { useWallet } from '@/store/WalletContext';
import { TransactionItem } from '@/features/wallet/components/TransactionItem';

export default function WalletScreen() {
  const { colors, isDark } = useTheme();
  const { balance, transactions, loading, refreshWallet } = useWallet();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cardGradient: [string, string] = isDark
    ? ['#2D0A00', '#180400']
    : [colors.primaryDark, colors.primary];

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
            <LinearGradient
              colors={cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/add-money')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Add Money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => router.push('/withdraw')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => router.push('/transaction-history')}
              activeOpacity={0.8}
            >
              <View style={styles.historyBtnLeft}>
                <View style={styles.historyIconBox}>
                  <Ionicons name="receipt-outline" size={21} color={colors.primary} />
                </View>
                <Text style={styles.historyBtnText}>Full Transaction History</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={colors.text.muted} />
            </TouchableOpacity>

            {transactions.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <TransactionItem tx={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.skeletonRow}>
                  <SkeletonBar width={36} height={36} radius={10} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBar width="60%" height={13} radius={6} />
                    <SkeletonBar width="40%" height={10} radius={5} />
                  </View>
                  <SkeletonBar width={64} height={13} radius={6} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={56} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyText}>Add money to get started</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    list: { padding: 16 },
    balanceCard: {
      borderRadius: 20, padding: 24, marginBottom: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    balanceLabel: {
      fontSize: 13, fontFamily: 'Inter_500Medium',
      color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: 0.3,
    },
    balanceAmount: {
      fontSize: 40, fontFamily: 'Inter_700Bold',
      color: '#fff', marginBottom: 22, letterSpacing: -1,
    },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 7,
      backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, height: 52,
    },
    actionBtnOutline: {
      backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
    historyBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.background.card, borderRadius: 14,
      padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border.default,
    },
    historyBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyIconBox: {
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center',
    },
    historyBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    sectionTitle: {
      fontSize: 17, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, marginBottom: 12,
    },
    skeletonList: { paddingTop: 8, gap: 10 },
    skeletonRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 4, paddingVertical: 6,
    },
    empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.secondary },
    emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
  });
}
