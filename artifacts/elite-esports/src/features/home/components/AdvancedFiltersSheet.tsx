import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MAX_H = SCREEN_H * 0.88;

export type SortOption = 'time' | 'prize' | 'entry';
export type EntryFilter = 'all' | 'free' | 'paid';

export interface AdvancedFilters {
  sortBy: SortOption;
  entryFilter: EntryFilter;
  selectedGame: string | null;
  selectedMode: string | null;
  selectedSquad: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (f: AdvancedFilters) => void;
  availableGames: string[];
  availableModes: string[];
  availableSquads: string[];
}

const SORT_OPTIONS: { key: SortOption; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'time',  label: 'Newest First', icon: 'clock' },
  { key: 'prize', label: 'Highest Prize', icon: 'award' },
  { key: 'entry', label: 'Lowest Entry',  icon: 'tag' },
];

const ENTRY_OPTIONS: { key: EntryFilter; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'all',  label: 'All',  icon: 'grid-outline',  color: '#8B5CF6' },
  { key: 'free', label: 'Free', icon: 'gift-outline',  color: '#22C55E' },
  { key: 'paid', label: 'Paid', icon: 'cash-outline',  color: '#EE3D2D' },
];

const DEFAULT_SQUAD_OPTIONS = ['Solo', 'Duo', '3v3', '4v4', 'Squad'];
const DEFAULT_MODE_OPTIONS  = ['Full Map', 'TDM', 'PVP', 'Battle Royale', 'Clash Squad', 'Ranked'];

function SectionLabel({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[sheetStyles.sectionLabel, { color: colors.text.muted }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function ChipRow({
  options, selected, onSelect, colors, accent,
}: {
  options: string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
  colors: any;
  accent?: string;
}) {
  const col = accent ?? colors.primary;
  return (
    <View style={sheetStyles.chipRow}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              sheetStyles.chip,
              {
                backgroundColor: active ? col + '18' : colors.background.elevated,
                borderColor: active ? col : colors.border.default,
              },
            ]}
            onPress={() => onSelect(active ? null : opt)}
            activeOpacity={0.75}
          >
            <Text style={[sheetStyles.chipText, { color: active ? col : colors.text.secondary }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AdvancedFiltersSheet({
  visible, onClose, filters, onApply,
  availableGames, availableModes, availableSquads,
}: Props) {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const slideAnim  = useRef(new Animated.Value(SHEET_MAX_H)).current;
  const bgAnim     = useRef(new Animated.Value(0)).current;

  const [local, setLocal] = React.useState<AdvancedFilters>(filters);

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_MAX_H, duration: 200, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const update = useCallback(<K extends keyof AdvancedFilters>(key: K, val: AdvancedFilters[K]) => {
    setLocal(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => {
    const def: AdvancedFilters = { sortBy: 'time', entryFilter: 'all', selectedGame: null, selectedMode: null, selectedSquad: null };
    setLocal(def);
    onApply(def);
    onClose();
  };

  const activeCount = [
    local.sortBy !== 'time',
    local.entryFilter !== 'all',
    !!local.selectedGame,
    !!local.selectedMode,
    !!local.selectedSquad,
  ].filter(Boolean).length;

  const modes  = availableModes.length  > 0 ? availableModes  : DEFAULT_MODE_OPTIONS;
  const squads = availableSquads.length > 0 ? availableSquads : DEFAULT_SQUAD_OPTIONS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[sheetStyles.backdrop, { opacity: bgAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[
          sheetStyles.sheet,
          {
            backgroundColor: colors.background.card,
            maxHeight: SHEET_MAX_H,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={[sheetStyles.handle, { backgroundColor: colors.border.default }]} />

        {/* Header */}
        <View style={[sheetStyles.header, { borderBottomColor: colors.border.default }]}>
          <TouchableOpacity onPress={handleReset} style={sheetStyles.headerAction}>
            <Text style={[sheetStyles.headerActionText, { color: colors.text.muted }]}>Reset</Text>
          </TouchableOpacity>
          <Text style={[sheetStyles.headerTitle, { color: colors.text.primary }]}>Advanced Filters</Text>
          <TouchableOpacity onPress={onClose} style={sheetStyles.headerAction}>
            <Ionicons name="close" size={26} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sheetStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Sort By ── */}
          <SectionLabel title="Sort By" colors={colors} />
          <View style={sheetStyles.sortRow}>
            {SORT_OPTIONS.map(opt => {
              const active = local.sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    sheetStyles.sortCard,
                    {
                      backgroundColor: active ? colors.primary + '15' : colors.background.elevated,
                      borderColor: active ? colors.primary : colors.border.default,
                    },
                  ]}
                  onPress={() => update('sortBy', opt.key)}
                  activeOpacity={0.75}
                >
                  <Feather name={opt.icon} size={23} color={active ? colors.primary : colors.text.muted} />
                  <Text style={[sheetStyles.sortCardText, { color: active ? colors.primary : colors.text.secondary }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={23} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[sheetStyles.divider, { backgroundColor: colors.border.default }]} />

          {/* ── Entry Fee ── */}
          <SectionLabel title="Entry Fee" colors={colors} />
          <View style={sheetStyles.sortRow}>
            {ENTRY_OPTIONS.map(opt => {
              const active = local.entryFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    sheetStyles.sortCard,
                    {
                      backgroundColor: active ? opt.color + '15' : colors.background.elevated,
                      borderColor: active ? opt.color : colors.border.default,
                    },
                  ]}
                  onPress={() => update('entryFilter', opt.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={opt.icon} size={23} color={active ? opt.color : colors.text.muted} />
                  <Text style={[sheetStyles.sortCardText, { color: active ? opt.color : colors.text.secondary }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={23} color={opt.color} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Game ── */}
          {availableGames.length > 0 && (
            <>
              <View style={[sheetStyles.divider, { backgroundColor: colors.border.default }]} />
              <SectionLabel title="Game" colors={colors} />
              <ChipRow
                options={availableGames}
                selected={local.selectedGame}
                onSelect={v => update('selectedGame', v)}
                colors={colors}
                accent="#3B82F6"
              />
            </>
          )}

          {/* ── Mode Type ── */}
          <View style={[sheetStyles.divider, { backgroundColor: colors.border.default }]} />
          <View style={sheetStyles.sectionRow}>
            <SectionLabel title="Mode Type" colors={colors} />
            <Text style={[sheetStyles.sectionHint, { color: colors.text.muted }]}>Admin configurable</Text>
          </View>
          <ChipRow
            options={modes}
            selected={local.selectedMode}
            onSelect={v => update('selectedMode', v)}
            colors={colors}
            accent="#8B5CF6"
          />

          {/* ── Squad Type ── */}
          <View style={[sheetStyles.divider, { backgroundColor: colors.border.default }]} />
          <SectionLabel title="Squad Type" colors={colors} />
          <ChipRow
            options={squads}
            selected={local.selectedSquad}
            onSelect={v => update('selectedSquad', v)}
            colors={colors}
            accent="#F59E0B"
          />
        </ScrollView>

        {/* Apply button */}
        <View style={[sheetStyles.footer, { borderTopColor: colors.border.default }]}>
          <TouchableOpacity
            style={[sheetStyles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={23} color="#fff" />
            <Text style={sheetStyles.applyText}>
              Apply Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerAction: { padding: 4, minWidth: 56, alignItems: 'center' },
  headerActionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  sectionHint: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sortCard: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  sortCardText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: {
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  applyText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
