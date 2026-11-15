import { AppTile, EmptyState } from '@dukaan/ui';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { currentLang } from '../i18n';
import { miniapps } from '../miniapps';

export function HomePage() {
  const { t } = useTranslation();
  if (miniapps.length === 0) return <EmptyState title={t('noApps')} hint={t('noAppsHint')} />;
  return (
    <>
      <h1 className="mb-3 font-display text-xl font-bold">{t('yourApps')}</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {miniapps.map(({ manifest }) => (
          <li key={manifest.id}>
            <AppTile
              name={manifest.name[currentLang()]}
              icon={<DynamicIcon name={manifest.icon as IconName} className="size-6" />}
              as={(props) => <Link to={`/apps/${manifest.id}`} {...props} />}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
