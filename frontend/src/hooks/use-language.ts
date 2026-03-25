import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { changeLanguage, supportedLanguages, type SupportedLanguage } from '@/lib/i18n';

/**
 * Hook to sync the i18n language with the user's profile preference.
 * Should be used in a component that has access to the auth context.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.language) {
      // Check if the user's language preference is supported
      const isSupported = supportedLanguages.some((lang) => lang.code === user.language);
      if (isSupported && i18n.language !== user.language) {
        changeLanguage(user.language);
      }
    }
  }, [user?.language, i18n.language]);

  return {
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
    supportedLanguages,
  };
}

/**
 * Hook to get translation utilities
 */
export { useTranslation } from 'react-i18next';
