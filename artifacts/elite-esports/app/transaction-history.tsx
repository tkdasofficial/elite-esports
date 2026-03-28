import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useWallet } from '@/store/WalletContext';
import { TransactionItem } from '@/features/wallet/components/TransactionItem';

export default function TransactionHistoryScreen() {
  const { transactions, loading, refreshWallet } = useWallet();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Transaction History" />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionItem tx={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
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
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
