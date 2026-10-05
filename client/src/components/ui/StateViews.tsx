import React from 'react';
import { Loader2, AlertCircle, Inbox, WifiOff } from 'lucide-react';
import Button from './Button';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading content...',
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const spinnerSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)] ${className}`}
    >
      <Loader2
        className={`${spinnerSizes[size]} animate-spin text-[var(--brand-accent)] mb-3`}
        aria-hidden="true"
      />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No items found',
  description = 'There are no records available to display right now.',
  actionText,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-muted)] mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryText?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section. Please try again.',
  retryText = 'Try Again',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--status-error)]/10 text-[var(--status-error)] flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </div>
  );
}

export interface OfflineBannerProps {
  message?: string;
  className?: string;
}

export function OfflineBanner({
  message = 'You are currently working offline. Some features may be unavailable.',
  className = '',
}: OfflineBannerProps) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-[var(--status-warning)] text-white text-xs font-semibold shadow-xs select-none ${className}`}
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
