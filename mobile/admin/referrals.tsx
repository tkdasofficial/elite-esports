import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';

interface Referral {
  id: string;
  referrer: string;
  referred: string;
  bonus: number;
  created_at: string;
}

export default function AdminReferrals() {
  const insets = useSafeAreaInsets();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadReferrals(); }, []);

  const loadReferrals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setReferrals(data as Referral[]);
    setLoading(false);
  };

  const filtered = referrals.filter(r =>
    r.referrer?.toLowerCase().includes(search.toLowerCase()) ||
    r.referred?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBonus = referrals.reduce((s, r) => s + (r.bonus ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{referrals.length}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{totalBonus}</Text>
          <Text style={styles.statLabel}>Coins Distributed</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by username..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.brandPrimary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="people" size={16} color={Colors.brandPrimary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowMain}>
                  <Text style={styles.bold}>{item.referrer}</Text>
                  <Text style={styles.arrow}> → </Text>
                  <Text>{item.referred}</Text>
                </Text>
                <Text style={styles.rowDate}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>+{item.bonus} coins</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No referrals yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  statRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: Colors.appCard, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  statVal: { fontSize: 24, fontWeight: '700', color: Colors.brandPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.appElevated, margin: 16, borderRadius: 12,
    paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: Colors.appBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: Colors.appBorder },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,107,43,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowMain: { fontSize: 14, color: Colors.textPrimary },
  bold: { fontWeight: '600' },
  arrow: { color: Colors.textMuted },
  rowDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bonusBadge: {
    backgroundColor: 'rgba(48,209,88,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  bonusText: { fontSize: 12, fontWeight: '600', color: Colors.brandSuccess },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
