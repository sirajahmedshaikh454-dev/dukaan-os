import { useId, type InputHTMLAttributes, type Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

/** A labelled text field. The label is always visible; the error sits right under the field. */
export function Input({ label, hint, error, className = '', ...rest }: InputProps) {
  const id = useId();
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${id}-note` : undefined}
        className={`min-h-12 rounded-xl border bg-surface px-4 text-base placeholder:text-muted/70 ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...rest}
      />
      {note && (
        <p
          id={`${id}-note`}
          role={error ? 'alert' : undefined}
          className={`text-sm ${error ? 'font-medium text-danger' : 'text-muted'}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
