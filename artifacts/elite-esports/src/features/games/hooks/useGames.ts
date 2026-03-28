import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Game } from '@/utils/types';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('games')
      .select('*')
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setGames(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { games, loading, error, refresh: fetch };
}
