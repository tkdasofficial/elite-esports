import { Match } from '@/utils/types';

export function adaptMatch(row: any): Match {
  return {
    id: row.id,
    title: row.title ?? '',
    game: row.games?.name ?? row.game ?? 'Unknown',
    banner_url: row.banner_url ?? undefined,
    entry_fee: row.entry_fee ?? 0,
    prize_pool: row.prize_pool ?? 0,
    players_joined: row.joined_players ?? row.players_joined ?? 0,
    max_players: row.max_players ?? 0,
    status: row.status ?? 'upcoming',
    starts_at: row.starts_at ?? row.created_at ?? new Date().toISOString(),
    room_id: row.room_id ?? undefined,
    room_password: row.room_password ?? undefined,
    description: row.description ?? undefined,
    stream_url: row.live_stream_url ?? row.stream_url ?? undefined,
  };
}

export function matchToDbPayload(m: {
  title: string;
  game_id: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  status: string;
  stream_url?: string | null;
}) {
  return {
    title: m.title,
    game_id: m.game_id,
    entry_fee: m.entry_fee,
    prize_pool: m.prize_pool,
    max_players: m.max_players,
    status: m.status,
    live_stream_url: m.stream_url ?? null,
  };
}
