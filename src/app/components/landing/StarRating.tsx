'use client';
import React from 'react';

interface StarRatingProps {
  rating: number;
  onChange?: (r: number) => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, readOnly = false, size = 20 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-wrap">

    <div className="flex justify-center">
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange && onChange(star)}
          style={{ cursor: readOnly ? 'default' : 'pointer', fontSize: size }}
          className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          aria-label={`${star} Star`}
        >
          ★
        </span>
      ))}
    </div>
      </div>
  );
};

export default StarRating;
