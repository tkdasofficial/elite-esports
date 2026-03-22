import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformStore } from '@/src/store/platformStore';
import { Colors } from '@/src/theme/colors';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: Colors.brandPrimary, bg: 'rgba(255,107,43,0.15)' },
  in_progress: { label: 'In Progress', color: Colors.brandWarning, bg: 'rgba(255,159,10,0.15)' },
  resolved:    { label: 'Resolved',    color: Colors.brandSuccess, bg: 'rgba(48,209,88,0.15)'  },
  closed:      { label: 'Closed',      color: Colors.textMuted,    bg: Colors.appElevated       },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: Colors.brandSuccess, medium: Colors.brandWarning, high: Colors.brandLive,
};

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Resolved'];

export default function AdminSupport() {
  const insets = useSafeAreaInsets();
  const { supportTickets, updateTicketStatus, replyToTicket } = usePlatformStore() as any;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  const tickets: any[] = supportTickets ?? [];
  const filtered = tickets.filter(t => {
    const matchSearch = t.subject?.toLowerCase().includes(search.toLowerCase()) || t.user?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter.toLowerCase().replace(' ', '_');
    return matchSearch && matchStatus;
  });

  const handleReply = () => {
    if (!activeTicket || !replyText.trim()) return;
    replyToTicket?.(activeTicket.id, replyText.trim());
    setReplyText('');
    Alert.alert('Sent', 'Reply sent.');
  };

  const handleStatus = (id: string, status: string) => {
    updateTicketStatus?.(id, status);
    if (activeTicket?.id === id) setActiveTicket((t: any) => t ? { ...t, status } : t);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tickets..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
          return (
            <TouchableOpacity style={styles.row} onPress={() => setActiveTicket(item)}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[item.priority] ?? Colors.textMuted }]} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowSubject} numberOfLines={1}>{item.subject}</Text>
                <Text style={styles.rowUser}>{item.user}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        }
      />

      <Modal visible={!!activeTicket} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{activeTicket?.subject}</Text>
              <TouchableOpacity onPress={() => setActiveTicket(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.ticketUser}>From: {activeTicket?.user}</Text>
              <Text style={styles.ticketMessage}>{activeTicket?.message}</Text>

              <Text style={styles.sectionLabel}>Change Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.statusBtn, { backgroundColor: cfg.bg }]}
                    onPress={() => handleStatus(activeTicket?.id, key)}
                  >
                    <Text style={[styles.statusBtnText, { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Reply</Text>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your reply..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.replyBtn} onPress={handleReply}>
                <Text style={styles.replyBtnText}>Send Reply</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.appElevated, margin: 16, marginBottom: 8,
    borderRadius: 12, paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.appElevated, borderRadius: 20,
  },
  filterChipActive: { backgroundColor: Colors.brandPrimary },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: Colors.appBorder },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  rowInfo: { flex: 1 },
  rowSubject: { fontSize: 15, color: Colors.textPrimary },
  rowUser: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 12 },
  modalScroll: { padding: 20, gap: 12 },
  ticketUser: { fontSize: 13, color: Colors.textMuted },
  ticketMessage: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginTop: 8 },
  sectionLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { gap: 8, paddingVertical: 4 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  statusBtnText: { fontSize: 13, fontWeight: '600' },
  replyInput: {
    backgroundColor: Colors.appElevated, borderRadius: 12, padding: 12,
    fontSize: 15, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  replyBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  replyBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
