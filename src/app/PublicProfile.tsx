import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { ArrowLeft, Star, Gamepad2, Shield, Trophy } from 'lucide-react';

interface PublicUserProfile {
  id: string;
  username: string;
  rank: string;
  bio: string;
  coins: number;
  is_admin: boolean;
  created_at: string;
}

interface GameProfile {
  id: string;
  game_name: string;
  ign: string;
  uid: string;
}

export default function PublicProfile() {
  const location = useLocation();
  // Extract username from path like /@someuser
  const username = location.pathname.slice(2) || '';
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, rank, bio, coins, is_admin, created_at')
        .eq('username', username)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setProfile(data);

      const { data: games } = await supabase
        .from('game_profiles')
        .select('id, game_name, ign, uid')
        .eq('user_id', data.id);

      if (games) setGameProfiles(games);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex justify-center">
      <div className="w-full md:max-w-[768px] lg:max-w-[1024px] bg-brand-dark md:border-x md:border-white/5 min-h-screen flex flex-col shadow-2xl">
        {/* Nav bar */}
        <header className="h-[56px] px-4 flex items-center gap-3 sticky top-0 z-50 bg-brand-dark/90 backdrop-blur-md border-b border-app-border">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-app-elevated flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <span className="text-[17px] font-semibold text-text-primary">
            @{username}
          </span>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : notFound || !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-app-elevated flex items-center justify-center">
              <Trophy size={28} className="text-text-muted" />
            </div>
            <p className="text-[20px] font-semibold text-text-primary">Profile not found</p>
            <p className="text-[15px] text-text-secondary">
              @{username} doesn't exist or hasn't set up their profile yet.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 px-6 py-2.5 bg-brand-primary rounded-full text-[15px] font-semibold text-white active:opacity-80"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex-1 pb-12 space-y-6">
            {/* Hero */}
            <div className="relative">
              <div className="h-[120px] bg-gradient-to-br from-brand-primary/25 via-brand-primary/8 to-transparent" />
              <div className="px-5 -mt-[52px] flex items-end justify-between">
                <div className="p-[3px] rounded-full bg-brand-dark">
                  <LetterAvatar name={profile.username} size="xl" />
                </div>
                <div className="pb-2 flex items-center gap-2">
                  {profile.is_admin && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/20 rounded-full text-[12px] font-medium text-brand-primary-light">
                      <Shield size={10} fill="currentColor" /> Admin
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/15 rounded-full text-[13px] font-medium text-brand-primary-light">
                    <Star size={11} fill="currentColor" /> {profile.rank}
                  </span>
                </div>
              </div>

              <div className="px-5 pt-3 space-y-0.5">
                <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.5px]">
                  {profile.username}
                </h2>
                <p className="text-[14px] text-text-muted font-normal">
                  @{profile.username}
                </p>
                {profile.bio && (
                  <p className="text-[15px] text-text-secondary leading-relaxed pt-1">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Rank card */}
            <div className="mx-5">
              <div className="bg-app-elevated rounded-[16px] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-text-muted font-normal uppercase tracking-wide">Current Rank</p>
                  <p className="text-[20px] font-semibold text-text-primary mt-0.5">{profile.rank}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-brand-primary/15 flex items-center justify-center">
                  <Trophy size={22} className="text-brand-primary-light" />
                </div>
              </div>
            </div>

            {/* Game profiles */}
            {gameProfiles.length > 0 && (
              <section className="mx-5 space-y-2">
                <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
                  Linked Games
                </p>
                <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
                  {gameProfiles.map(g => (
                    <div key={g.id} className="flex items-center gap-3.5 px-4 py-3.5">
                      <div className="w-9 h-9 rounded-[10px] bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
                        <Gamepad2 size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-normal text-text-primary">{g.game_name}</p>
                        <p className="text-[13px] text-text-muted font-normal mt-0.5">{g.ign} · {g.uid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="text-center text-[12px] text-text-muted font-normal">
              Elite Esports Platform
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
