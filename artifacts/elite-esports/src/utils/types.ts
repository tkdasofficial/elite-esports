export interface Match {
  id: string;
  title: string;
  game: string;
  game_id?: string;
  banner_url?: string;
  entry_fee: number;
  prize_pool: number;
  players_joined: number;
  max_players: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  starts_at: string;
  room_id?: string;
  room_password?: string;
  room_visible: boolean;
  description?: string;
  rules?: string;
  stream_url?: string;
  youtube_url?: string;
  twitch_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  game_mode?: string;
  squad_type?: string;
}

export interface LeaderEntry {
  id: string;
  username: string;
  wins: number;
  rank: number;
  avatar_url?: string;
  total_points?: number;
  total_kills?: number;
  matches_played?: number;
}

export interface ProfileData {
  id?: string;
  full_name?: string;
  username?: string | null;
  avatar_index?: number;
  games?: { game_id?: string; game: string; uid: string }[] | null;
  balance?: number;
  updated_at?: string;
  played?: number;
  wins?: number;
  earned?: number;
}

export interface Game {
  id: string;
  name: string;
  banner_url?: string;
  created_at: string;
}

export interface SupportTicket {
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: '#3B82F6' },
  ongoing:   { label: 'Live',      color: '#22C55E' },
  completed: { label: 'Ended',     color: '#666666' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
};
