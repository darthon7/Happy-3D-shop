import React, { useState, useEffect } from "react";
import { reviewsApi } from "../../api";
import { useAuthStore } from "../../stores";
import toast from "react-hot-toast";
import { StarRating } from "./StarRating";
import { RatingDistribution } from "./RatingDistribution";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { motion } from "framer-motion";

export const ReviewSection = ({ productId }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [canReview, setCanReview] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchReviews(0, true);
      fetchStats();
      if (isAuthenticated) {
        checkCanReview();
      }
    }
  }, [productId, isAuthenticated]);

  const fetchReviews = async (pageNum, reset = false) => {
    try {
      const response = await reviewsApi.getByProduct(productId, { page: pageNum, size: 5 });
      setReviews(prev => reset ? response.data.content : [...prev, ...response.data.content]);
      setHasMore(!response.data.isLast);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reviewsApi.getStats(productId);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await reviewsApi.canReview(productId);
      setCanReview(response.data.canReview);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  };

  const handleSubmitReview = async (data) => {
    setIsSubmitting(true);
    try {
      await reviewsApi.create(productId, data);
      toast.success("¡Reseña publicada con éxito!");
      setIsFormOpen(false);
      
      // Refresh data
      fetchReviews(0, true);
      fetchStats();
      setCanReview(false); // Can only review once
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al publicar la reseña.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !reviews.length) {
    return (
      <div className="animate-pulse space-y-8 mt-16">
        <div className="h-48 bg-gray-100 rounded-2xl w-full"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-50 rounded-2xl w-full"></div>
          <div className="h-32 bg-gray-50 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-20 border-t border-gray-100 pt-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white">Reseñas de clientes</h2>
          <p className="text-gray-400 mt-2">
            Lo que otros piensan sobre este producto
          </p>
        </div>
        {canReview && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="hidden sm:block bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Escribir reseña
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <RatingDistribution stats={stats} />
            {canReview && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 sm:hidden w-full bg-white text-black px-6 py-3.5 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
              >
                Escribir reseña
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800 border-dashed backdrop-blur-sm">
              <StarRating rating={0} size={40} className="mx-auto mb-4 opacity-30 justify-center" />
              <h3 className="text-xl font-heading font-semibold text-white mb-2">
                Aún no hay reseñas
              </h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Sé el primero en compartir tu experiencia con este producto.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ReviewCard review={review} />
                </motion.div>
              ))}
              
              {hasMore && (
                <div className="pt-6 pb-2 text-center">
                  <button
                    onClick={() => fetchReviews(page + 1)}
                    className="px-6 py-3 border border-gray-700 text-gray-300 font-medium rounded-full hover:border-white hover:text-white transition-colors"
                  >
                    Cargar más reseñas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <ReviewForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmitting}
        />
      )}
    </section>
  );
};

export default ReviewSection;
