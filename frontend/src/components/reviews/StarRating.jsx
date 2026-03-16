import React from "react";
import { Star, StarHalf } from "lucide-react";

export const StarRating = ({
  rating,
  size = 16,
  className = "",
  onChange,
  disabled = false,
}) => {
  const isInteractive = !!onChange && !disabled;

  const handleClick = (value) => {
    if (isInteractive) {
      onChange(value);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        let isFilled = rating >= starIndex;
        let isHalf = !isFilled && rating >= starIndex - 0.5;

        return (
          <button
            key={starIndex}
            type={isInteractive ? "button" : "button"}
            disabled={!isInteractive}
            onClick={() => handleClick(starIndex)}
            className={`
              focus:outline-none flex-shrink-0
              ${isInteractive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            `}
          >
            {isHalf ? (
              <div className="relative">
                <Star size={size} className="text-gray-300" strokeWidth={1.5} />
                <div className="absolute top-0 left-0 overflow-hidden w-1/2 h-full">
                  <Star
                    size={size}
                    className="text-yellow-400 fill-yellow-400"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            ) : (
              <Star
                size={size}
                className={
                  isFilled
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 fill-transparent"
                }
                strokeWidth={1.5}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
