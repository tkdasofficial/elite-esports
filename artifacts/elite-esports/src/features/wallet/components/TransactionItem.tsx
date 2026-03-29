import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { Transaction } from '@/store/WalletContext';

const STATUS_COLORS = {
  pending: Colors.status.warning,
  approved: Colors.status.success,
  rejected: Colors.status.error,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

interface Props {
  tx: Transaction;
}

export function TransactionItem({ tx }: Props) {
  const isCredit = tx.type === 'credit';
  const statusColor = STATUS_COLORS[tx.status] ?? Colors.text.muted;

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, {
        backgroundColor: isCredit
          ? Colors.status.success + '18'
          : Colors.status.error + '18',
      }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
          size={22}
          color={isCredit ? Colors.status.success : Colors.status.error}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>{tx.description}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[tx.status] ?? tx.status}
            </Text>
          </View>
          <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={[styles.amount, { color: isCredit ? Colors.status.success : Colors.status.error }]}>
        {isCredit ? '+' : '−'}₹{tx.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.background.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  desc: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
    marginBottom: 5,
    letterSpacing: -0.1,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    flexShrink: 0,
  },
});
