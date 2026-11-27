import { EmptyState, ErrorState, LoadingState } from '@dukaan/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Component, Suspense, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet, Route, Routes, useParams } from 'react-router';
import { api, useAuth } from './api';
import { currentLang } from './i18n';
import { miniapps } from './miniapps';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { Layout } from './pages/Layout';

/** Screens that need a logged-in shopkeeper. */
function Private() {
  const { t } = useTranslation();
  const status = useAuth((s) => s.status);
  if (status === 'loading') return <LoadingState label={t('loading')} />;
  if (status === 'out') return <Navigate to="/login" replace />;
  return <Layout />;
}

/** Login and signup: skip them when already logged in. */
function Public() {
  const { t } = useTranslation();
  const status = useAuth((s) => s.status);
  if (status === 'loading') return <LoadingState label={t('loading')} />;
  if (status === 'in') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** If one mini-app crashes, the rest of the shell keeps working. */
class AppBoundary extends Component<{ fallback: ReactNode; children: ReactNode }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('notFound')}
      action={
        <Link to="/" className="font-semibold text-primary underline">
          {t('goHome')}
        </Link>
      }
    />
  );
}

function MiniAppPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const app = miniapps.find((a) => a.manifest.id === id);
  if (!app?.Screen) return <NotFound />;
  const Back = currentLang() === 'ur' ? ArrowRight : ArrowLeft; // "back" points the other way in RTL
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/"
          aria-label={t('back')}
          className="flex size-12 items-center justify-center rounded-xl hover:bg-surface"
        >
          <Back aria-hidden="true" />
        </Link>
        <h1 className="font-display text-xl font-bold">{app.manifest.name[currentLang()]}</h1>
      </div>
      <AppBoundary
        key={id}
        fallback={
          <ErrorState
            title={t('appFailed')}
            retryLabel={t('retry')}
            onRetry={() => location.reload()}
          />
        }
      >
        <Suspense fallback={<LoadingState label={t('loading')} />}>
          <app.Screen
            api={(path, options) => api(`/apps/${app.manifest.id}${path}`, options)}
            lang={currentLang()}
          />
        </Suspense>
      </AppBoundary>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Public />}>
        <Route path="/login" element={<AuthPage kind="login" />} />
        <Route path="/signup" element={<AuthPage kind="signup" />} />
      </Route>
      <Route element={<Private />}>
        <Route index element={<HomePage />} />
        <Route path="/apps/:id/*" element={<MiniAppPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
