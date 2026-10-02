import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export function Skeleton({
  variant = 'rounded',
  className = '',
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-md',
  };

  return (
    <div
      className={`animate-pulse bg-[var(--surface-muted)] ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
