import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  accent: 'bg-accent text-on-accent hover:brightness-95',
  secondary: 'bg-surface text-fg border border-border hover:bg-bg',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  /** Shows a spinner and blocks double taps while a request is running. */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      // min-h-12 = 48px: a comfortable touch target on a small phone
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
