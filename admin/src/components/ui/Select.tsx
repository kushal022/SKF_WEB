import React, { forwardRef, useId } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      children,
      id,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`
            w-full text-sm rounded-md border transition-all duration-150
            bg-[var(--surface-surface)] text-[var(--text-primary)]
            py-2 px-3 pr-8
            ${
              error
                ? 'border-[var(--status-error)] focus:ring-2 focus:ring-[var(--status-error)]/20 focus:border-[var(--status-error)]'
                : 'border-[var(--border-border)] focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]'
            }
            ${disabled ? 'opacity-60 bg-[var(--surface-muted)] cursor-not-allowed' : ''}
            focus:outline-none cursor-pointer
            ${className}
          `}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
        {error ? (
          <p className="text-xs text-[var(--status-error)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
