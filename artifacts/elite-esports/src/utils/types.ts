export interface Match {
  id: string;
  title: string;
  game: string;
  banner_url?: string;
  entry_fee: number;
  prize_pool: number;
  players_joined: number;
  max_players: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  starts_at: string;
  room_id?: string;
  room_password?: string;
  description?: string;
  stream_url?: string;
}

export interface LeaderEntry {
  id: string;
  username: string;
  kills: number;
  points: number;
  rank: number;
  avatar_url?: string;
}

export interface ProfileData {
  id?: string;
  full_name?: string;
  username?: string | null;
  avatar_index?: number;
  games?: { game_id?: string; game: string; uid: string }[] | null;
  balance?: number;
  updated_at?: string;
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
export type LeaderboardTab = 'Solo' | 'Squad';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: '#3B82F6' },
  ongoing: { label: 'Live', color: '#22C55E' },
  completed: { label: 'Ended', color: '#666666' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
};
