import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin === true);
        setLoading(false);
      });
  }, [userId]);

  return { isAdmin, loading };
}
