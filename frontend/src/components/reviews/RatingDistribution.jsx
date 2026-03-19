import React from "react";
import { StarRating } from "./StarRating";
import { motion } from "framer-motion";

export const RatingDistribution = ({ stats }) => {
  if (!stats) return null;

  const { averageRating, totalReviews, distribution } = stats;

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border h-full shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center gap-8">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 md:w-48">
          <h2 className="text-5xl font-bold font-heading mb-2 text-white">
            {averageRating.toFixed(1)}
          </h2>
          <StarRating rating={averageRating} size={24} className="mb-2" />
          <p className="text-sm text-text-muted font-medium">{totalReviews} reseñas</p>
        </div>

        {/* Distribution Bars */}
        <div className="flex-1 space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm font-bold w-3 text-right text-text-secondary">
                  {stars}
                </span>
                <StarRating rating={1} size={14} />
                <div className="flex-1 h-2.5 bg-background-dark/50 border border-border/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-text-muted w-8 text-right font-bold">
                  {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingDistribution;
