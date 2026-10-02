import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] shadow-sm focus-visible:outline-[var(--brand-primary)]',
      secondary:
        'bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--border-border)] active:scale-[0.98] focus-visible:outline-[var(--brand-secondary)]',
      outline:
        'border border-[var(--border-border)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-muted)] active:scale-[0.98] focus-visible:outline-[var(--brand-accent)]',
      ghost:
        'text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-muted)] active:scale-[0.98] focus-visible:outline-[var(--brand-accent)]',
      accent:
        'bg-[var(--brand-accent)] text-white hover:opacity-90 active:scale-[0.98] shadow-sm focus-visible:outline-[var(--brand-accent)]',
      danger:
        'bg-[var(--status-error)] text-white hover:opacity-90 active:scale-[0.98] shadow-sm focus-visible:outline-[var(--status-error)]',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
