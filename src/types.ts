export type MatchStatus = 'live' | 'upcoming' | 'completed';

export interface MatchParticipant {
  id: string;
  username: string;
  email?: string;
  joinedAt: string;
}

export interface MatchWinners {
  first?: MatchParticipant;
  second?: MatchParticipant;
  third?: MatchParticipant;
}

export interface Match {
  match_id: string;
  game_name: string;
  title: string;
  mode: '1v1' | '2v2' | '4v4' | 'Squad';
  banner_image: string;
  team1_name: string;
  team2_name: string;
  team1_logo: string;
  team2_logo: string;
  status: MatchStatus;
  start_time: string;
  end_time?: string;
  entry_fee: string;
  prize: string;
  slots_total: number;
  slots_filled: number;
  team1_score?: number;
  team2_score?: number;
  completed_at?: string;
  show_until?: string;
  delete_at?: string;
  participants?: MatchParticipant[];
  winners?: MatchWinners;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  coins: number;
  rank: string;
}

export interface Game {
  id: string;
  name: string;
  category: string;
  logo: string;
  banner: string;
  status: 'active' | 'inactive';
  matches: number;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  link: string;
  isActive: boolean;
}
