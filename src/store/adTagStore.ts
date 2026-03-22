import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

export type AdTagType     = 'banner' | 'interstitial' | 'native' | 'custom';
export type AdCodeType    = 'html' | 'javascript' | 'url';
export type AdPosition    = 'home' | 'matches' | 'leaderboard' | 'wallet' | 'global';

export interface AdTag {
  id:         string;
  name:       string;
  type:       AdTagType;
  code_type:  AdCodeType;
  code:       string;
  position:   AdPosition;
  is_active:  boolean;
  priority:   number;
  notes:      string;
  created_at: string;
  updated_at: string;
}

export type AdTagInput = Omit<AdTag, 'id' | 'created_at' | 'updated_at'>;

const CACHE_KEY = 'elite-ad-tags-v1';

function readCache(): AdTag[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') as AdTag[];
  } catch {
    return [];
  }
}

function writeCache(tags: AdTag[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tags.filter(t => t.is_active)));
  } catch {}
}

interface AdTagState {
  tags:    AdTag[];
  loading: boolean;
  error:   string | null;

  /** Fetch only active tags (for the app / regular users) */
  fetchActiveTags: () => Promise<void>;
  /** Fetch ALL tags including inactive (admin panel) */
  fetchAllTags: () => Promise<void>;
  /** Create a new tag (admin) */
  createTag: (input: AdTagInput) => Promise<void>;
  /** Update an existing tag (admin) */
  updateTag: (id: string, updates: Partial<AdTagInput>) => Promise<void>;
  /** Toggle is_active on/off (admin) */
  toggleTag: (id: string) => Promise<void>;
  /** Delete a tag permanently (admin) */
  deleteTag: (id: string) => Promise<void>;
  /** Get tags for a specific screen position */
  tagsForPosition: (position: AdPosition) => AdTag[];
}

export const useAdTagStore = create<AdTagState>((set, get) => ({
  tags:    [],
  loading: false,
  error:   null,

  fetchActiveTags: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('ad_tags')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      const tags = (data ?? []) as AdTag[];
      writeCache(tags);
      set({ tags, loading: false });
    } catch (err: any) {
      const fallback = readCache();
      set({ tags: fallback, loading: false, error: err?.message ?? 'Fetch failed — using cache' });
    }
  },

  fetchAllTags: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('ad_tags')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tags: (data ?? []) as AdTag[], loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? 'Failed to fetch tags' });
    }
  },

  createTag: async (input) => {
    const { data, error } = await supabase
      .from('ad_tags')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    set(s => ({ tags: [data as AdTag, ...s.tags] }));
  },

  updateTag: async (id, updates) => {
    const { error } = await supabase
      .from('ad_tags')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
    set(s => ({
      tags: s.tags.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  },

  toggleTag: async (id) => {
    const tag = get().tags.find(t => t.id === id);
    if (!tag) return;
    await get().updateTag(id, { is_active: !tag.is_active });
  },

  deleteTag: async (id) => {
    const { error } = await supabase
      .from('ad_tags')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    set(s => ({ tags: s.tags.filter(t => t.id !== id) }));
  },

  tagsForPosition: (position) => {
    const { tags } = get();
    return tags
      .filter(t => t.is_active && (t.position === position || t.position === 'global'))
      .sort((a, b) => b.priority - a.priority);
  },
}));
