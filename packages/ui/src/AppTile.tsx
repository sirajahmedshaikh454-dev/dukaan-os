import type { ReactNode } from 'react';

interface AppTileProps {
  name: string;
  icon: ReactNode;
  /** The shell passes its router link here, so this package needs no router. */
  as: (props: { className: string; children: ReactNode }) => ReactNode;
}

/** One mini-app on the home screen: a big icon with the name under it. */
export function AppTile({ name, icon, as: Link }: AppTileProps) {
  return (
    <Link className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center transition-colors duration-150 hover:border-primary active:scale-[0.98]">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-xl bg-primary text-on-primary"
      >
        {icon}
      </span>
      <span className="text-sm font-semibold">{name}</span>
    </Link>
  );
}
