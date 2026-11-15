import { loginSchema, signupSchema } from '@dukaan/core';
import { Button, Card, Input } from '@dukaan/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';
import { ApiError, authenticate } from '../api';
import { LanguageButton } from './Layout';

// Login has no shop name, but both forms share one shape so the code below stays simple.
const loginFormSchema = loginSchema.extend({ shopName: z.string() });

interface FormValues {
  phone: string;
  password: string;
  shopName: string;
}

/** Login and signup are the same form; signup just has one more field. */
export function AuthPage({ kind }: { kind: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const isSignup = kind === 'signup';
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // The same Zod schemas the API uses, so the form and the server always agree.
    resolver: zodResolver(isSignup ? signupSchema : loginFormSchema),
    defaultValues: { phone: '', password: '', shopName: '' },
  });

  const onSubmit = handleSubmit(async ({ phone, password, shopName }) => {
    setServerError(null);
    try {
      await authenticate(kind, isSignup ? { phone, password, shopName } : { phone, password });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'server_error';
      setServerError(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    }
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10">
      <div className="flex justify-end py-3">
        <LanguageButton />
      </div>
      <header className="mb-6 mt-4 text-center">
        <p className="font-display text-4xl font-bold text-primary">Dukaan OS</p>
        <p className="mt-1 text-muted">{t('tagline')}</p>
      </header>

      <Card>
        <h1 className="mb-4 font-display text-xl font-bold">{t(kind)}</h1>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex flex-col gap-4">
          {isSignup && (
            <Input
              label={t('shopName')}
              autoComplete="organization"
              error={errors.shopName && t('fieldErrors.shopName')}
              {...register('shopName')}
            />
          )}
          <Input
            label={t('phone')}
            hint={t('phoneHint')}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            error={errors.phone && t('fieldErrors.phone')}
            {...register('phone')}
          />
          <Input
            label={t('password')}
            hint={isSignup ? t('passwordHint') : undefined}
            type="password"
            dir="ltr"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            error={
              errors.password &&
              t(isSignup ? 'fieldErrors.password' : 'fieldErrors.passwordRequired')
            }
            {...register('password')}
          />
          {serverError && (
            <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger">
              {serverError}
            </p>
          )}
          <Button type="submit" loading={isSubmitting}>
            {t(kind)}
          </Button>
        </form>
      </Card>

      <Link
        to={isSignup ? '/login' : '/signup'}
        className="mt-4 flex min-h-12 items-center justify-center font-semibold text-primary underline"
      >
        {t(isSignup ? 'haveAccount' : 'noAccount')}
      </Link>
    </div>
  );
}
