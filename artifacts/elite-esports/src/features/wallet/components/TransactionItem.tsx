import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Transaction } from '@/store/WalletContext';

interface Props { tx: Transaction; }

export function TransactionItem({ tx }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isCredit = tx.type === 'credit';

  const STATUS_COLORS = {
    pending:  colors.status.warning,
    approved: colors.status.success,
    rejected: colors.status.error,
  };

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={24}
          color={isCredit ? colors.status.success : colors.status.error}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>{tx.description}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[tx.status] }]} />
          <Text style={[styles.status, { color: STATUS_COLORS[tx.status] }]}>{tx.status}</Text>
          <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isCredit ? colors.status.success : colors.status.error }]}>
        {isCredit ? '+' : '-'}₹{tx.amount}
      </Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: colors.background.card, padding: 16,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border.subtle,
    },
    icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    desc: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 5 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    status: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
    date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginLeft: 4 },
    amount: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  });
}
