'use client';

// Initialize the shared API client (must be first import with side effects)
import '@/lib/shared-api-init';

import { ThemeProvider } from 'next-themes';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/contexts';
import { Toaster } from '@/components/ui/sonner';
import i18n from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem storageKey='theme' disableTransitionOnChange>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
