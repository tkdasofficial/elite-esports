import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { useWallet } from '@/store/WalletContext';
import { TransactionItem } from '@/features/wallet/components/TransactionItem';
import type { AppColors } from '@/utils/colors';

const SKELETON_COUNT = 6;

function TransactionSkeleton({ colors }: { colors: AppColors }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.background.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    }}>
      <SkeletonBar width={44} height={44} radius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBar width="55%" height={13} radius={6} />
        <SkeletonBar width="35%" height={11} radius={6} />
      </View>
      <SkeletonBar width={60} height={16} radius={6} />
    </View>
  );
}

export default function TransactionHistoryScreen() {
  const { transactions, loading, refreshWallet } = useWallet();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const showSkeleton = loading && transactions.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Transaction History" />

      <View style={styles.windowBanner}>
        <Ionicons name="time-outline" size={18} color={colors.text.muted} />
        <Text style={styles.windowText}>Showing last 7 days · auto-cleared daily</Text>
      </View>

      {showSkeleton ? (
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          renderItem={() => <TransactionSkeleton colors={colors} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyText}>Deposits and withdrawals from the last 7 days will appear here</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          onRefresh={refreshWallet}
          refreshing={loading}
        />
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background.dark },
    windowBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    },
    windowText: {
      fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted,
    },
    list:       { padding: 16 },
    empty:      { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary },
    emptyText:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', paddingHorizontal: 32 },
  });
}
