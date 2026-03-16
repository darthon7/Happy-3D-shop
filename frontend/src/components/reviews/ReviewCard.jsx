import React from "react";
import { StarRating } from "./StarRating";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

export const ReviewCard = ({ review }) => {
  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm transition-colors hover:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <StarRating rating={review.rating} size={16} />
          <h3 className="font-heading font-semibold mt-2 text-lg text-white">
            {review.title}
          </h3>
        </div>
        <span className="text-sm text-gray-500">
          {format(new Date(review.createdAt), "dd MMM yyyy", { locale: es })}
        </span>
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed">{review.comment}</p>

      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <span className="font-medium text-sm text-gray-400">
          {review.authorName}
        </span>
        {review.isVerified && (
          <div className="flex items-center text-green-400 text-xs font-medium bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} className="mr-1" />
            Compra verificada
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
