import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  status: 'active' | 'suspended' | 'banned' | null;
  is_admin: boolean | null;
  created_at: string | null;
  balance: number;
  total_deposits: number;
  total_withdrawals: number;
  match_count: number;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'banned';
type WalletAction = 'add' | 'deduct';

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  suspended: '#F59E0B',
  banned: '#EF4444',
};

function getStatusLabel(s: string | null) {
  if (!s || s === 'active') return 'Active';
  if (s === 'suspended') return 'Suspended';
  if (s === 'banned') return 'Banned';
  return s;
}

function initials(u: UserRow) {
  const n = u.name ?? u.username ?? '?';
  return n.slice(0, 2).toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [walletModal, setWalletModal] = useState<{ user: UserRow; action: WalletAction } | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, walletsRes, paymentsRes, withdrawalsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('user_id, balance').then(r => r).catch(() => ({ data: null })),
      supabase.from('payments').select('user_id, amount, status').then(r => r).catch(() => ({ data: null })),
      supabase.from('withdrawals').select('user_id, amount, status').then(r => r).catch(() => ({ data: null })),
    ]);

    const walletMap: Record<string, number> = {};
    for (const w of (walletsRes.data ?? [])) {
      walletMap[w.user_id] = w.balance ?? 0;
    }

    const depositMap: Record<string, number> = {};
    for (const p of ((paymentsRes.data ?? []).filter((p: any) => p.status === 'approved'))) {
      depositMap[p.user_id] = (depositMap[p.user_id] ?? 0) + (p.amount ?? 0);
    }

    const withdrawMap: Record<string, number> = {};
    for (const w of ((withdrawalsRes.data ?? []).filter((w: any) => w.status === 'approved'))) {
      withdrawMap[w.user_id] = (withdrawMap[w.user_id] ?? 0) + (w.amount ?? 0);
    }

    const rows: UserRow[] = (usersRes.data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name ?? u.full_name ?? null,
      username: u.username ?? null,
      email: u.email ?? null,
      phone: u.phone ?? null,
      status: u.status ?? 'active',
      is_admin: u.is_admin ?? false,
      created_at: u.created_at ?? null,
      balance: walletMap[u.id] ?? 0,
      total_deposits: depositMap[u.id] ?? 0,
      total_withdrawals: withdrawMap[u.id] ?? 0,
      match_count: 0,
    }));

    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q);
    const effectiveStatus = u.status ?? 'active';
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts: Record<StatusFilter, number> = {
    all: users.length,
    active: users.filter(u => !u.status || u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length,
  };

  // ─── Actions ───────────────────────────────────────────────────────────────
  const updateStatus = async (user: UserRow, newStatus: 'active' | 'suspended' | 'banned') => {
    const labels: Record<string, string> = { active: 'Activate', suspended: 'Suspend', banned: 'Ban' };
    const desc: Record<string, string> = {
      active: `Restore access for ${user.name ?? user.username}?`,
      suspended: `Temporarily suspend ${user.name ?? user.username}? They won't be able to join matches.`,
      banned: `Permanently ban ${user.name ?? user.username}? This is a serious action.`,
    };

    Alert.alert(labels[newStatus], desc[newStatus], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: labels[newStatus],
        style: newStatus === 'banned' ? 'destructive' : 'default',
        onPress: async () => {
          setActioning(true);
          const { error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', user.id);

          if (error) {
            if (error.message.includes('column') || error.code === '42703') {
              Alert.alert(
                'Migration Required',
                'Your database is missing the "status" column on users.\n\nRun this SQL in Supabase:\n\nALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\';',
                [{ text: 'OK' }],
              );
            } else {
              Alert.alert('Error', error.message);
            }
            setActioning(false);
            return;
          }

          setActioning(false);
          setSelectedUser(null);
          load();
        },
      },
    ]);
  };

  const handleWalletAdjust = async () => {
    if (!walletModal) return;
    const amt = parseFloat(walletAmount);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }

    setActioning(true);
    const { user, action } = walletModal;
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    const current = wallet?.balance ?? 0;
    const newBalance = action === 'add' ? current + amt : Math.max(0, current - amt);

    const { error } = await supabase
      .from('wallets')
      .upsert({ user_id: user.id, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    setActioning(false);
    if (error) { Alert.alert('Error', error.message); return; }

    Alert.alert('Done', `₹${amt} ${action === 'add' ? 'added to' : 'deducted from'} wallet.`);
    setWalletModal(null);
    setWalletAmount('');
    setSelectedUser(null);
    load();
  };

  const handleDeleteUser = (user: UserRow) => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.name ?? user.username}?\n\nThis cannot be undone and will remove all their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setActioning(true);
            await supabase.from('users').delete().eq('id', user.id);
            setActioning(false);
            setSelectedUser(null);
            load();
          },
        },
      ],
    );
  };

  const FILTERS: StatusFilter[] = ['all', 'active', 'suspended', 'banned'];

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Users"
        rightElement={
          <TouchableOpacity onPress={load} style={styles.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, username, email…"
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="none"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
            onPress={() => setStatusFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            {counts[f] > 0 && (
              <View style={[styles.filterBadge, statusFilter === f && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, statusFilter === f && { color: Colors.primary }]}>
                  {counts[f]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading users…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'desktop' : 'mobile'}
          columnWrapperStyle={isDesktop ? { gap: 12 } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyHint}>
                {search ? 'Try a different search term' : `No ${statusFilter} users`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onPress={() => setSelectedUser(item)}
              style={isDesktop ? { flex: 1 } : {}}
            />
          )}
        />
      )}

      {/* User Detail Modal */}
      <Modal
        visible={!!selectedUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdateStatus={updateStatus}
            onWalletAction={(u, action) => { setWalletModal({ user: u, action }); }}
            onDelete={handleDeleteUser}
            actioning={actioning}
          />
        )}
      </Modal>

      {/* Wallet Adjust Modal */}
      <Modal
        visible={!!walletModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => { setWalletModal(null); setWalletAmount(''); }}
      >
        {walletModal && (
          <View style={styles.walletModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {walletModal.action === 'add' ? 'Add Funds' : 'Deduct Funds'}
              </Text>
              <TouchableOpacity
                onPress={() => { setWalletModal(null); setWalletAmount(''); }}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.walletModalBody}>
              <View style={[styles.walletAmtBox, { backgroundColor: walletModal.action === 'add' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }]}>
                <Ionicons
                  name={walletModal.action === 'add' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={32}
                  color={walletModal.action === 'add' ? Colors.status.success : Colors.status.error}
                />
                <Text style={styles.walletUserName}>{walletModal.user.name ?? walletModal.user.username}</Text>
                <Text style={styles.walletCurrentBal}>Current balance: ₹{walletModal.user.balance.toFixed(2)}</Text>
              </View>

              <Text style={styles.fieldLabel}>Amount (₹)</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amtInput}
                  value={walletAmount}
                  onChangeText={setWalletAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              {walletAmount && !isNaN(parseFloat(walletAmount)) && (
                <Text style={styles.previewText}>
                  New balance: ₹{Math.max(0, walletModal.user.balance + (walletModal.action === 'add' ? 1 : -1) * parseFloat(walletAmount)).toFixed(2)}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: walletModal.action === 'add' ? Colors.status.success : Colors.status.error },
                  (actioning || !walletAmount) && { opacity: 0.5 },
                ]}
                onPress={handleWalletAdjust}
                disabled={actioning || !walletAmount}
                activeOpacity={0.85}
              >
                {actioning ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.confirmBtnText}>
                    {walletModal.action === 'add' ? 'Add Funds' : 'Deduct Funds'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user, onPress, style }: { user: UserRow; onPress: () => void; style?: object }) {
  const status = user.status ?? 'active';
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.active;

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { borderColor: statusColor + '60' }]}>
          <Text style={[styles.avatarText, { color: statusColor }]}>{initials(user)}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{user.name ?? 'No name'}</Text>
          {user.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {status !== 'active' && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardUsername}>@{user.username ?? 'unknown'}</Text>
        {user.email && <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>}
        <Text style={styles.cardBalance}>₹{user.balance.toFixed(2)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({
  user, onClose, onUpdateStatus, onWalletAction, onDelete, actioning,
}: {
  user: UserRow;
  onClose: () => void;
  onUpdateStatus: (u: UserRow, s: 'active' | 'suspended' | 'banned') => void;
  onWalletAction: (u: UserRow, action: WalletAction) => void;
  onDelete: (u: UserRow) => void;
  actioning: boolean;
}) {
  const insets = useSafeAreaInsets();
  const status = user.status ?? 'active';
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.active;

  return (
    <View style={styles.detailModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>User Profile</Text>
        <TouchableOpacity onPress={onClose} style={styles.modalClose} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.detailBody, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.bigAvatar, { borderColor: statusColor + '80' }]}>
            <Text style={[styles.bigAvatarText, { color: statusColor }]}>{initials(user)}</Text>
          </View>
          <Text style={styles.profileName}>{user.name ?? 'No name'}</Text>
          <Text style={styles.profileUsername}>@{user.username ?? 'unknown'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDotInline, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{getStatusLabel(user.status)}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <InfoTile icon="calendar-outline" label="Joined" value={fmtDate(user.created_at)} />
          <InfoTile icon="wallet-outline" label="Balance" value={`₹${user.balance.toFixed(2)}`} valueColor={Colors.status.success} />
          <InfoTile icon="arrow-down-circle-outline" label="Total Deposits" value={`₹${user.total_deposits.toFixed(0)}`} />
          <InfoTile icon="arrow-up-circle-outline" label="Total Withdrawn" value={`₹${user.total_withdrawals.toFixed(0)}`} />
        </View>

        {/* Contact Info */}
        {(user.email || user.phone) && (
          <View style={styles.contactCard}>
            <Text style={styles.sectionLabel}>Contact Info</Text>
            {user.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={15} color={Colors.text.muted} />
                <Text style={styles.contactText}>{user.email}</Text>
              </View>
            )}
            {user.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={15} color={Colors.text.muted} />
                <Text style={styles.contactText}>{user.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Wallet Actions */}
        <Text style={styles.sectionLabel}>Wallet Management</Text>
        <View style={styles.twoCol}>
          <TouchableOpacity
            style={[styles.actionBlock, { borderColor: Colors.status.success + '40', backgroundColor: 'rgba(34,197,94,0.06)' }]}
            onPress={() => onWalletAction(user, 'add')} activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={22} color={Colors.status.success} />
            <Text style={[styles.actionBlockText, { color: Colors.status.success }]}>Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBlock, { borderColor: Colors.status.error + '40', backgroundColor: 'rgba(239,68,68,0.06)' }]}
            onPress={() => onWalletAction(user, 'deduct')} activeOpacity={0.8}
          >
            <Ionicons name="remove-circle-outline" size={22} color={Colors.status.error} />
            <Text style={[styles.actionBlockText, { color: Colors.status.error }]}>Deduct Funds</Text>
          </TouchableOpacity>
        </View>

        {/* Status Actions */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Account Actions</Text>
        <View style={styles.statusActions}>
          {status !== 'active' && (
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: Colors.status.success + '40' }]}
              onPress={() => onUpdateStatus(user, 'active')} activeOpacity={0.8} disabled={actioning}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.status.success} />
              <Text style={[styles.statusBtnText, { color: Colors.status.success }]}>
                {status === 'banned' ? 'Unban User' : 'Unsuspend User'}
              </Text>
            </TouchableOpacity>
          )}
          {status !== 'suspended' && status !== 'banned' && (
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: Colors.status.warning + '40' }]}
              onPress={() => onUpdateStatus(user, 'suspended')} activeOpacity={0.8} disabled={actioning}
            >
              <Ionicons name="pause-circle-outline" size={18} color={Colors.status.warning} />
              <Text style={[styles.statusBtnText, { color: Colors.status.warning }]}>Suspend User</Text>
            </TouchableOpacity>
          )}
          {status === 'suspended' && (
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: Colors.status.error + '40' }]}
              onPress={() => onUpdateStatus(user, 'banned')} activeOpacity={0.8} disabled={actioning}
            >
              <Ionicons name="ban-outline" size={18} color={Colors.status.error} />
              <Text style={[styles.statusBtnText, { color: Colors.status.error }]}>Ban User</Text>
            </TouchableOpacity>
          )}
          {status !== 'banned' && (
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: Colors.status.error + '40' }]}
              onPress={() => onUpdateStatus(user, 'banned')} activeOpacity={0.8} disabled={actioning}
            >
              <Ionicons name="ban-outline" size={18} color={Colors.status.error} />
              <Text style={[styles.statusBtnText, { color: Colors.status.error }]}>Ban User</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Danger Zone */}
        {!user.is_admin && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Danger Zone</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(user)} activeOpacity={0.8} disabled={actioning}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
              <Text style={styles.deleteBtnText}>Delete User Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoTile({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon as any} size={16} color={Colors.text.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  card: '#111111',
  border: '#2A2A2A',
  elevated: '#1A1A1A',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular' },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  filterBtnActive: { backgroundColor: 'rgba(254,76,17,0.12)', borderColor: Colors.primary + '60' },
  filterText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  filterTextActive: { color: Colors.primary },
  filterBadge: { backgroundColor: C.elevated, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeActive: { backgroundColor: 'rgba(254,76,17,0.15)' },
  filterBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.text.muted },

  list: { paddingHorizontal: 16 },
  resultCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  // User Card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardLeft: { position: 'relative' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statusDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: C.card },
  cardBody: { flex: 1, gap: 2 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  adminBadge: { backgroundColor: 'rgba(254,76,17,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  cardUsername: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  cardEmail: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  cardBalance: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.status.success, marginTop: 2 },

  // Detail Modal
  detailModal: { flex: 1, backgroundColor: Colors.background.dark },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.elevated, borderRadius: 10 },
  detailBody: { padding: 20 },
  profileHeader: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  bigAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, marginBottom: 4,
  },
  bigAvatarText: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  profileUsername: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  statusDotInline: { width: 7, height: 7, borderRadius: 4 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  infoTile: {
    flex: 1, minWidth: '44%',
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 4,
  },
  infoLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  contactCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, gap: 10, marginBottom: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },

  twoCol: { flexDirection: 'row', gap: 10 },
  actionBlock: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, padding: 16, borderWidth: 1,
  },
  actionBlockText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  statusActions: { gap: 10 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  statusBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.status.error },

  // Wallet Modal
  walletModal: { flex: 1, backgroundColor: Colors.background.dark },
  walletModalBody: { padding: 24, gap: 16 },
  walletAmtBox: {
    alignItems: 'center', borderRadius: 16, padding: 24, gap: 8,
    borderWidth: 1, borderColor: C.border,
  },
  walletUserName: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  walletCurrentBal: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, height: 56,
  },
  currencySymbol: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  amtInput: { flex: 1, fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  previewText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  confirmBtn: {
    height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
