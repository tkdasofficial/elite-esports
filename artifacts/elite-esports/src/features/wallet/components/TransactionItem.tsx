import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Transaction } from '@/store/WalletContext';
import type { AppColors } from '@/utils/colors';

interface Props { tx: Transaction; }

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#F59E0B' },
  approved: { label: 'Approved', color: '#22C55E' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};

const TYPE_CONFIG = {
  credit: {
    icon:       'arrow-down-circle' as const,
    iconColor:  '#22C55E',
    iconBg:     'rgba(34,197,94,0.12)',
    amountSign: '+',
    amountColor:'#22C55E',
  },
  debit: {
    icon:       'arrow-up-circle' as const,
    iconColor:  '#EF4444',
    iconBg:     'rgba(239,68,68,0.12)',
    amountSign: '-',
    amountColor:'#EF4444',
  },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}  ${time}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export function TransactionItem({ tx }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const typeConf   = TYPE_CONFIG[tx.type];
  const statusConf = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.row}>

      {/* Left icon */}
      <View style={[styles.iconWrap, { backgroundColor: typeConf.iconBg }]}>
        <Ionicons name={typeConf.icon} size={26} color={typeConf.iconColor} />
      </View>

      {/* Middle info */}
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>{tx.label}</Text>
        {!!tx.description && (
          <Text style={styles.desc} numberOfLines={1}>{tx.description}</Text>
        )}
        <Text style={styles.date}>{formatDateTime(tx.created_at)}</Text>
      </View>

      {/* Right: amount + status */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: typeConf.amountColor }]}>
          {typeConf.amountSign}₹{formatAmount(tx.amount)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConf.color + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
          <Text style={[styles.statusText, { color: statusConf.color }]}>
            {statusConf.label}
          </Text>
        </View>
      </View>

    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             14,
      backgroundColor: colors.background.card,
      padding:         16,
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     colors.border.subtle,
    },
    iconWrap: {
      width: 50, height: 50, borderRadius: 15,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    info: {
      flex: 1,
      gap:  3,
    },
    label: {
      fontSize:    15,
      fontFamily:  'Inter_600SemiBold',
      color:       colors.text.primary,
    },
    desc: {
      fontSize:    12,
      fontFamily:  'Inter_400Regular',
      color:       colors.text.muted,
    },
    date: {
      fontSize:    11,
      fontFamily:  'Inter_400Regular',
      color:       colors.text.muted,
      marginTop:   1,
    },
    right: {
      alignItems:  'flex-end',
      gap:          6,
      flexShrink:   0,
    },
    amount: {
      fontSize:   16,
      fontFamily: 'Inter_700Bold',
    },
    statusBadge: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:             4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius:   20,
    },
    statusDot: {
      width: 5, height: 5, borderRadius: 3,
    },
    statusText: {
      fontSize:   11,
      fontFamily: 'Inter_600SemiBold',
    },
  });
}
