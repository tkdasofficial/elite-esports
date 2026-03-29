import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Line, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  users: number;
  matches: number;
  revenue: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  activeMatches: number;
}

interface RecentMatch {
  id: string;
  title: string;
  game: string;
  status: string;
  players_joined: number;
  max_players: number;
  prize_pool: number;
  entry_fee: number;
}

interface Activity {
  id: string;
  type: 'payment' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
  user_name: string | null;
}

interface MatchStatusCounts {
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  upcoming: '#3B82F6',
  ongoing: '#22C55E',
  completed: '#8B5CF6',
  cancelled: '#EF4444',
};

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ color }: { color: string }) {
  const pts = [30, 55, 40, 70, 50, 80, 65, 90, 75, 95];
  const w = 80, h = 36;
  const maxV = Math.max(...pts);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - (v / maxV) * h * 0.85);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const fill = `${d} L${w},${h} L0,${h} Z`;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={`sg${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fill} fill={`url(#sg${color})`} />
      <Path d={d} stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}

// ─── Bar Chart (Matches by Status) ───────────────────────────────────────────
function MatchBarChart({ counts }: { counts: MatchStatusCounts }) {
  const labels = ['Upcoming', 'Ongoing', 'Done', 'Cancelled'];
  const values = [counts.upcoming, counts.ongoing, counts.completed, counts.cancelled];
  const colors = ['#3B82F6', '#22C55E', '#8B5CF6', '#EF4444'];
  const maxV = Math.max(...values, 1);
  const chartH = 110;
  const barW = 28;
  const gap = 18;
  const totalW = labels.length * (barW + gap) - gap;

  return (
    <Svg width={totalW} height={chartH + 30}>
      {values.map((v, i) => {
        const barH = Math.max(4, (v / maxV) * chartH);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <React.Fragment key={labels[i]}>
            <Defs>
              <LinearGradient id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors[i]} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors[i]} stopOpacity="0.5" />
              </LinearGradient>
            </Defs>
            <Rect
              x={x} y={chartH} width={barW} height={0}
              fill={`url(#bg${i})`} rx={6}
            />
            <Rect
              x={x} y={y} width={barW} height={barH}
              fill={`url(#bg${i})`} rx={6}
            />
            <SvgText
              x={x + barW / 2} y={chartH + 18}
              textAnchor="middle" fontSize={9}
              fill="#666" fontWeight="600"
            >
              {labels[i].slice(0, 4)}
            </SvgText>
            <SvgText
              x={x + barW / 2} y={y - 5}
              textAnchor="middle" fontSize={10}
              fill={colors[i]} fontWeight="700"
            >
              {v}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Area Chart (Revenue trend - simulated from real data) ────────────────────
function AreaChart({ revenue, matches }: { revenue: number; matches: number }) {
  const pts = [
    Math.random() * 0.3 + 0.1, Math.random() * 0.2 + 0.2,
    Math.random() * 0.3 + 0.3, Math.random() * 0.2 + 0.4,
    Math.random() * 0.3 + 0.5, Math.random() * 0.2 + 0.6,
    1,
  ].map(v => Math.min(v, 1));

  const w = 200, h = 80;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - v * h * 0.9);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `${d} L${w},${h} L0,${h} Z`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FE4C11" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#FE4C11" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fill} fill="url(#areaG)" />
      <Path d={d} stroke="#FE4C11" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [stats, setStats] = useState<Stats | null>(null);
  const [matchCounts, setMatchCounts] = useState<MatchStatusCounts>({ upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 });
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, matchesRes, paymentsRes, withdrawRes, activeRes, recentMatchRes, payActRes, wdActRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id, status', { count: 'exact' }),
      supabase.from('payments').select('amount, status'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'ongoing'),
      supabase.from('matches').select('id, title, status, joined_players, max_players, prize_pool, entry_fee, games(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('payments').select('id, amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(4),
      supabase.from('withdrawals').select('id, amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(4),
    ]);

    const payments = paymentsRes.data ?? [];
    const revenue = payments.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount ?? 0), 0);
    const pendingPay = payments.filter(p => p.status === 'pending').length;

    const allMatches = matchesRes.data ?? [];
    setMatchCounts({
      upcoming: allMatches.filter(m => m.status === 'upcoming').length,
      ongoing: allMatches.filter(m => m.status === 'ongoing').length,
      completed: allMatches.filter(m => m.status === 'completed').length,
      cancelled: allMatches.filter(m => m.status === 'cancelled').length,
    });

    setStats({
      users: usersRes.count ?? 0,
      matches: matchesRes.count ?? 0,
      revenue,
      pendingPayments: pendingPay,
      pendingWithdrawals: withdrawRes.count ?? 0,
      activeMatches: activeRes.count ?? 0,
    });

    setRecentMatches((recentMatchRes.data ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      game: m.games?.name ?? 'Unknown',
      status: m.status,
      players_joined: m.joined_players ?? 0,
      max_players: m.max_players ?? 100,
      prize_pool: m.prize_pool ?? 0,
      entry_fee: m.entry_fee ?? 0,
    })));

    // Collect user IDs for name lookup
    const payAct = payActRes.data ?? [];
    const wdAct = wdActRes.data ?? [];
    const allUserIds = [...new Set([...payAct.map(p => p.user_id), ...wdAct.map(w => w.user_id)])];
    let userMap: Record<string, string> = {};
    if (allUserIds.length > 0) {
      const { data: uData } = await supabase.from('users').select('id, name, username').in('id', allUserIds);
      for (const u of (uData ?? [])) {
        userMap[u.id] = u.name ?? u.username ?? 'User';
      }
    }

    const combined: Activity[] = [
      ...payAct.map(p => ({ id: p.id, type: 'payment' as const, amount: p.amount, status: p.status, created_at: p.created_at, user_name: userMap[p.user_id] ?? null })),
      ...wdAct.map(w => ({ id: w.id, type: 'withdrawal' as const, amount: w.amount, status: w.status, created_at: w.created_at, user_name: userMap[w.user_id] ?? null })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
    setActivity(combined);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = (stats?.pendingPayments ?? 0) + (stats?.pendingWithdrawals ?? 0);

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Dashboard"
        rightElement={
          <TouchableOpacity onPress={load} style={styles.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading dashboard…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* ── Top Stat Cards ─────────────────────────────────────────────── */}
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            <StatCard
              icon="people" color="#3B82F6"
              label="Total Users" value={String(stats?.users ?? 0)}
              sub="Registered accounts" trend={+12} isDesktop={isDesktop}
            />
            <StatCard
              icon="trophy" color="#F59E0B"
              label="Total Matches" value={String(stats?.matches ?? 0)}
              sub={`${stats?.activeMatches ?? 0} live now`} trend={+8} isDesktop={isDesktop}
            />
            <StatCard
              icon="trending-up" color="#22C55E"
              label="Total Revenue" value={formatCurrency(stats?.revenue ?? 0)}
              sub="Approved deposits" trend={+20} isDesktop={isDesktop}
            />
            <StatCard
              icon="time" color={pending > 0 ? '#EF4444' : '#8B5CF6'}
              label="Pending Items" value={String(pending)}
              sub={`${stats?.pendingPayments ?? 0} pay · ${stats?.pendingWithdrawals ?? 0} w/d`}
              trend={pending > 0 ? -5 : 0} alert={pending > 0} isDesktop={isDesktop}
            />
          </View>

          {/* ── Middle Row ─────────────────────────────────────────────────── */}
          <View style={[styles.row, isDesktop && styles.rowDesktop]}>
            {/* Left: Match Overview Chart */}
            <View style={[styles.card, styles.chartCard, isDesktop && { flex: 1.4 }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Match Overview</Text>
                  <Text style={styles.cardSub}>Distribution by status</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>{stats?.activeMatches ?? 0} Live</Text>
                </View>
              </View>
              <View style={styles.chartWrap}>
                <MatchBarChart counts={matchCounts} />
              </View>
              <View style={styles.chartLegend}>
                {['upcoming', 'ongoing', 'completed', 'cancelled'].map(s => (
                  <View key={s} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[s] }]} />
                    <Text style={styles.legendText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Revenue Card + Mini Stats */}
            <View style={[styles.col, isDesktop && { flex: 1 }]}>
              <View style={[styles.card, styles.revenueCard]}>
                <View style={styles.revenueTop}>
                  <View>
                    <Text style={styles.cardSub}>Total Revenue</Text>
                    <Text style={styles.revenueValue}>{formatCurrency(stats?.revenue ?? 0)}</Text>
                  </View>
                  <AreaChart revenue={stats?.revenue ?? 0} matches={stats?.matches ?? 0} />
                </View>
                <View style={styles.revenueMeta}>
                  <Ionicons name="arrow-up" size={12} color={Colors.status.success} />
                  <Text style={styles.revenueMetaText}>
                    <Text style={{ color: Colors.status.success }}>+20% </Text>
                    than last month
                  </Text>
                </View>
              </View>

              <View style={styles.miniGrid}>
                <MiniStat icon="people-outline" color="#3B82F6" label="Players" value={String(stats?.users ?? 0)} />
                <MiniStat icon="game-controller-outline" color="#F59E0B" label="Matches" value={String(stats?.matches ?? 0)} />
                <MiniStat icon="checkmark-circle-outline" color="#22C55E" label="Completed" value={String(matchCounts.completed)} />
                <MiniStat icon="wifi-outline" color="#EC4899" label="Live" value={String(stats?.activeMatches ?? 0)} />
              </View>
            </View>
          </View>

          {/* ── Bottom Row ─────────────────────────────────────────────────── */}
          <View style={[styles.row, isDesktop && styles.rowDesktop]}>
            {/* Left: Recent Matches Table */}
            <View style={[styles.card, isDesktop && { flex: 1.5 }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Recent Matches</Text>
                  <Text style={styles.cardSub}>Latest tournament activity</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/admin/matches')} activeOpacity={0.8} style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {isDesktop && (
                <View style={styles.tableHeader}>
                  {['Match', 'Game', 'Prize Pool', 'Players', 'Status'].map(h => (
                    <Text key={h} style={[styles.tableHeaderCell, h === 'Match' && { flex: 2 }]}>{h}</Text>
                  ))}
                </View>
              )}

              {recentMatches.length === 0 ? (
                <Text style={styles.emptyText}>No matches yet</Text>
              ) : (
                recentMatches.map((m, i) => (
                  <MatchRow key={m.id} match={m} isDesktop={isDesktop} isLast={i === recentMatches.length - 1} />
                ))
              )}
            </View>

            {/* Right: Activity Feed */}
            <View style={[styles.card, isDesktop && { flex: 1 }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                  <Text style={styles.cardSub}>Payments & withdrawals</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/admin/payments')} activeOpacity={0.8} style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {activity.length === 0 ? (
                <Text style={styles.emptyText}>No recent activity</Text>
              ) : (
                activity.map((a, i) => (
                  <ActivityRow key={a.id} item={a} isLast={i === activity.length - 1} />
                ))
              )}
            </View>
          </View>

          {/* ── Quick Nav Cards ───────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Quick Access</Text>
          <View style={[styles.quickGrid, isDesktop && styles.quickGridDesktop]}>
            {QUICK_NAV.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
                {item.badge ? (
                  <View style={[styles.quickBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.quickBadgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, color, label, value, sub, trend, alert, isDesktop }: {
  icon: string; color: string; label: string; value: string;
  sub: string; trend: number; alert?: boolean; isDesktop: boolean;
}) {
  return (
    <View style={[styles.statCard, alert && styles.statCardAlert, isDesktop && styles.statCardDesktop]}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.trendWrap}>
          <Ionicons
            name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={trend >= 0 ? Colors.status.success : Colors.status.error}
          />
          <Text style={[styles.trendText, { color: trend >= 0 ? Colors.status.success : Colors.status.error }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function MiniStat({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniStatIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function MatchRow({ match, isDesktop, isLast }: { match: RecentMatch; isDesktop: boolean; isLast: boolean }) {
  const pct = Math.round((match.players_joined / Math.max(match.max_players, 1)) * 100);
  const statusColor = STATUS_COLORS[match.status] ?? '#666';
  return (
    <View style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
      {isDesktop ? (
        <>
          <View style={{ flex: 2 }}>
            <Text style={styles.tableCell} numberOfLines={1}>{match.title}</Text>
          </View>
          <Text style={[styles.tableCell, { flex: 1 }]}>{match.game}</Text>
          <Text style={[styles.tableCell, { flex: 1, color: Colors.status.success }]}>{formatCurrency(match.prize_pool)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableCell}>{match.players_joined}/{match.max_players}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: statusColor }]} />
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{match.status}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableCell} numberOfLines={1}>{match.title}</Text>
            <Text style={styles.tableSub}>{match.game} · {formatCurrency(match.prize_pool)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: statusColor }]} />
            </View>
            <Text style={styles.tableSub}>{match.players_joined}/{match.max_players} players</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: statusColor + '20', alignSelf: 'center' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{match.status}</Text>
          </View>
        </>
      )}
    </View>
  );
}

function ActivityRow({ item, isLast }: { item: Activity; isLast: boolean }) {
  const isCredit = item.type === 'payment';
  const iconColor = isCredit ? Colors.status.success : Colors.status.error;
  const iconName = isCredit ? 'arrow-down-circle' : 'arrow-up-circle';
  const statusColor = item.status === 'approved'
    ? Colors.status.success : item.status === 'rejected'
      ? Colors.status.error : Colors.status.warning;

  return (
    <View style={[styles.activityRow, !isLast && styles.tableRowBorder]}>
      <View style={[styles.activityIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityUser} numberOfLines={1}>
          {item.user_name ?? 'User'}
        </Text>
        <Text style={styles.activityMeta}>
          {isCredit ? 'Deposit' : 'Withdrawal'} · {timeAgo(item.created_at)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.activityAmount, { color: isCredit ? Colors.status.success : Colors.status.error }]}>
          {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <Text style={[styles.activityStatus, { color: statusColor }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const QUICK_NAV = [
  { icon: 'people-outline' as const,          label: 'Users',        route: '/admin/users',        color: '#3B82F6' },
  { icon: 'trophy-outline' as const,           label: 'Matches',      route: '/admin/matches',      color: '#F59E0B' },
  { icon: 'game-controller-outline' as const,  label: 'Games',        route: '/admin/games',        color: '#8B5CF6' },
  { icon: 'card-outline' as const,             label: 'Payments',     route: '/admin/payments',     color: '#22C55E' },
  { icon: 'cash-outline' as const,             label: 'Withdrawals',  route: '/admin/withdrawals',  color: '#EF4444' },
  { icon: 'headset-outline' as const,          label: 'Support',      route: '/admin/support',      color: '#06B6D4' },
  { icon: 'flag-outline' as const,             label: 'Reports',      route: '/admin/reports',      color: '#F97316' },
  { icon: 'megaphone-outline' as const,        label: 'Broadcast',    route: '/admin/broadcast',    color: '#EC4899' },
  { icon: 'bar-chart-outline' as const,        label: 'Monetization', route: '/admin/monetization', color: '#84CC16' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = '#111111';
const BORDER = '#222222';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loaderText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 12 },

  // Stat Cards
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    width: '47%', flexGrow: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    gap: 4,
  },
  statCardDesktop: { width: 'auto', flex: 1 },
  statCardAlert: { borderColor: 'rgba(239,68,68,0.3)' },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trendWrap: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 3 },
  trendText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary, lineHeight: 28 },
  statLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  statSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 1 },

  // Layout rows
  row: { gap: 12 },
  rowDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 12 },

  // Cards
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },

  // Chart Card
  chartCard: {},
  chartWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#22C55E' },

  // Revenue Card
  revenueCard: { marginBottom: 0 },
  revenueTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  revenueValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginTop: 4 },
  revenueMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revenueMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  // Mini grid
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniStat: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  miniStatIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  miniStatValue: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  miniStatLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  // Table
  tableHeader: {
    flexDirection: 'row', paddingBottom: 10, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tableHeaderCell: {
    flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  tableCell: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  tableSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  progressBar: {
    height: 4, backgroundColor: '#222', borderRadius: 2,
    overflow: 'hidden', marginTop: 5,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center', paddingVertical: 20 },

  // Activity
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityUser: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  activityMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  activityAmount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  activityStatus: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 2, textTransform: 'capitalize' },

  // Quick nav
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 4,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickGridDesktop: {},
  quickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD_BG, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER,
    width: '47%', flexGrow: 1,
  },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  quickBadge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  quickBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },
});
