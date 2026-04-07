import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) { setIsAdmin(false); setLoading(false); return; }

    (async () => {
      try {
        const { data } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return { isAdmin, loading };
}
