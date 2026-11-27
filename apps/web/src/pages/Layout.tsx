import { useQuery } from '@tanstack/react-query';
import { Languages, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { api, logout, type Me } from '../api';
import { toggleLang } from '../i18n';

export function LanguageButton() {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-surface"
    >
      <Languages aria-hidden="true" className="size-5" />
      {t('switchLanguage')}
    </button>
  );
}

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me') });

export function Layout() {
  const { t } = useTranslation();
  const me = useMe();
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between gap-2 py-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-primary">Dukaan OS</p>
          {/* reserve the line so the header does not jump when the name arrives */}
          <p className="min-h-5 truncate text-sm text-muted">{me.data?.tenant.name}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <LanguageButton />
          <button
            type="button"
            // One tap in the corner should not log a busy shopkeeper out by accident.
            onClick={() => {
              if (confirm(t('logoutConfirm'))) void logout();
            }}
            aria-label={t('logout')}
            title={t('logout')}
            className="flex size-12 cursor-pointer items-center justify-center rounded-xl hover:bg-surface"
          >
            <LogOut aria-hidden="true" className="size-5 rtl:-scale-x-100" />
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
