import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/translations';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: 'English (UK)',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'hearth-language' },
  ),
);
