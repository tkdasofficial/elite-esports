import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

export interface Category {
  id: string;
  name: string;
  iconName: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    iconName: row.icon ?? row.icon_name ?? '',
  };
}

export const useCategoryStore = create<CategoryState>()((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      set({ categories: (data ?? []).map(rowToCategory) });
    } catch (e) {
      console.error('fetchCategories error:', e);
    } finally {
      set({ loading: false });
    }
  },

  addCategory: async (cat) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: cat.name, icon: cat.iconName })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set((s) => ({ categories: [...s.categories, rowToCategory(data)] }));
  },

  updateCategory: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.name    !== undefined) dbUpdates.name = updates.name;
    if (updates.iconName !== undefined) dbUpdates.icon = updates.iconName;
    const { error } = await supabase
      .from('categories')
      .update(dbUpdates)
      .eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
