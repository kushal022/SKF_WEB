import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  const variantStyles = {
    primary: 'bg-[var(--brand-primary)] text-[var(--text-inverse)]',
    secondary: 'bg-[var(--surface-muted)] text-[var(--text-primary)]',
    success: 'bg-[var(--status-success)]/15 text-[var(--status-success)] font-semibold',
    warning: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] font-semibold',
    error: 'bg-[var(--status-error)]/15 text-[var(--status-error)] font-semibold',
    info: 'bg-[var(--status-info)]/15 text-[var(--status-info)] font-semibold',
    outline: 'border border-[var(--border-border)] text-[var(--text-secondary)]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
