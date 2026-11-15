import { CircleAlert, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';

// Loading, empty and error are designed screens, not leftovers (CLAUDE.md section 11).

function StateShell({ children, role }: { children: ReactNode; role?: 'status' | 'alert' }) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      {children}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <StateShell role="status">
      <Spinner className="size-8 text-primary" />
      <p className="text-muted">{label}</p>
    </StateShell>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <StateShell>
      <Inbox aria-hidden="true" className="size-10 text-muted" />
      <p className="font-display text-lg font-bold">{title}</p>
      {hint && <p className="text-muted">{hint}</p>}
      {action}
    </StateShell>
  );
}

export function ErrorState({
  title,
  hint,
  retryLabel,
  onRetry,
}: {
  title: string;
  hint?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <StateShell role="alert">
      <CircleAlert aria-hidden="true" className="size-10 text-danger" />
      <p className="font-display text-lg font-bold">{title}</p>
      {hint && <p className="text-muted">{hint}</p>}
      {onRetry && retryLabel && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </StateShell>
  );
}
