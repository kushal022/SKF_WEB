import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = false,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= rating;

          return (
            <Star
              key={index}
              className={`${starSize} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-neutral-200 text-neutral-300 dark:fill-neutral-700 dark:text-neutral-600'
              }`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default StarRating;
