// components/StarRating.tsx
"use client";
import { useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
}

export default function StarRating({ rating, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (value: number) => {
    onChange(value);
  };

  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
    const isHalf = e.clientX - left < width / 2;
    setHover(isHalf ? index - 0.5 : index);
  };

  return (
    <div className="flex space-x-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => {
        const currentRating = hover ?? rating;
        let icon;
        if (currentRating >= star) {
          icon = <FaStar className="star" />;
        } else if (currentRating >= star - 0.5) {
          icon = <FaStarHalfAlt className="star" />;
        } else {
          icon = <FaRegStar className="star-empty" />;
        }

        return (
          <span
            key={star}
            onClick={(e) => {
              const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
              const isHalf = e.clientX - left < width / 2;
              handleClick(isHalf ? star - 0.5 : star);
            }}
            onMouseMove={(e) => handleMouseMove(star, e)}
            onMouseLeave={() => setHover(null)}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
