import type { MiniappScreenProps } from '@dukaan/core';
import { Card, ErrorState, LoadingState } from '@dukaan/ui';
import { useQuery } from '@tanstack/react-query';

const text = {
  en: {
    label: 'Pings received from the Hello app',
    hint: 'This number goes up each time Hello sends a ping.',
    loading: 'Loading…',
    failed: 'Could not load the count',
    retry: 'Try again',
  },
  ur: {
    label: 'سلام ایپ سے ملنے والی پِنگز',
    hint: 'جب بھی سلام ایپ پِنگ بھیجتی ہے، یہ نمبر بڑھ جاتا ہے۔',
    loading: 'لوڈ ہو رہا ہے…',
    failed: 'گنتی لوڈ نہیں ہو سکی',
    retry: 'دوبارہ کوشش کریں',
  },
};

export default function CounterScreen({ api, lang }: MiniappScreenProps) {
  const t = text[lang];
  const count = useQuery({
    queryKey: ['counter', 'pings'],
    queryFn: () => api<{ pings: number }>('/'),
    staleTime: 0, // always ask again when the screen opens
  });

  if (count.isPending) return <LoadingState label={t.loading} />;
  if (count.isError) {
    return (
      <ErrorState title={t.failed} retryLabel={t.retry} onRetry={() => void count.refetch()} />
    );
  }
  return (
    <Card className="text-center">
      <p className="text-muted">{t.label}</p>
      <p data-testid="ping-count" className="my-2 font-display text-6xl font-bold text-primary">
        {count.data.pings}
      </p>
      <p className="text-sm text-muted">{t.hint}</p>
    </Card>
  );
}
