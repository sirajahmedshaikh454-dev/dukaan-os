import type { MiniappScreenProps } from '@dukaan/core';
import { Button, Card } from '@dukaan/ui';
import { useState } from 'react';

const text = {
  en: {
    intro: 'Tap the button to send a "ping" event. The Counter app is listening.',
    send: 'Send ping',
    sent: (n: number) => `Sent ${n} ping${n === 1 ? '' : 's'}. Open Counter to see it.`,
    failed: 'Could not send. Check your internet and try again.',
  },
  ur: {
    intro: 'بٹن دبائیں تو ایک "پِنگ" ایونٹ جائے گا۔ کاؤنٹر ایپ اسے سن رہی ہے۔',
    send: 'پِنگ بھیجیں',
    sent: (n: number) => `${n} پِنگ بھیج دی گئی۔ دیکھنے کے لیے کاؤنٹر کھولیں۔`,
    failed: 'نہیں بھیجا جا سکا۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔',
  },
};

export default function HelloScreen({ api, lang }: MiniappScreenProps) {
  const t = text[lang];
  const [sent, setSent] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');

  async function ping() {
    setState('sending');
    try {
      await api('/ping', { method: 'POST', body: {} });
      setSent((n) => n + 1);
      setState('idle');
    } catch {
      setState('failed');
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <p>{t.intro}</p>
      <Button loading={state === 'sending'} onClick={() => void ping()}>
        {t.send}
      </Button>
      {/* live region: screen readers announce the result */}
      <p role="status" className={state === 'failed' ? 'font-medium text-danger' : 'text-muted'}>
        {state === 'failed' ? t.failed : sent > 0 ? t.sent(sent) : ''}
      </p>
    </Card>
  );
}
