import { useMemo } from 'react';
import { translations, TranslationKey } from '@/lib/translations';
import { useI18nStore } from '@/store/i18nStore';

/**
 * useI18n — returns a `t` function that translates a key into the current language.
 * Uses Zustand so it's reactive — changing the language in Settings instantly
 * updates every component that calls useI18n().
 *
 * Usage:  const { t } = useI18n();
 *         <h1>{t('dashboard.tagline')}</h1>
 */
export function useI18n() {
  const lang = useI18nStore((s) => s.language);

  const t = useMemo(() => {
    const dict = translations[lang] ?? translations['English (UK)'];
    return (key: TranslationKey, fallback?: string): string => {
      return dict[key] ?? fallback ?? key;
    };
  }, [lang]);

  return { t, lang };
}
