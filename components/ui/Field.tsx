import type { ReactNode } from 'react';

/** Campo de formulario: label (.fl) + control + hint, sobre la clase .field. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="fl">
        {label}
        {required && <span style={{ color: 'var(--coral)' }}> *</span>}
      </span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
