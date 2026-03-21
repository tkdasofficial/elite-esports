import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Category {
  id: string;
  name: string;
  iconName: string;
}

interface CategoryState {
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: [],

      addCategory: (cat) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...cat, id: Math.random().toString(36).slice(2, 10) },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'elite-categories-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);
