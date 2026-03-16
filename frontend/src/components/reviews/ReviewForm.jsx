import React, { useState } from "react";
import { StarRating } from "./StarRating";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ReviewForm = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }
    if (!title.trim() || !comment.trim()) {
      toast.error("El título y comentario son requeridos");
      return;
    }

    onSubmit({ rating, title, comment });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-heading font-bold text-white">Escribir una reseña</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tu calificación
                </label>
                <StarRating
                  rating={rating}
                  onChange={(val) => setRating(val)}
                  size={32}
                  className="gap-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Título de la reseña
                </label>
                <input
                  type="text"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-500"
                  placeholder="Ej. Excelente calidad"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Comentario
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder-gray-500"
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-medium py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Publicar reseña"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewForm;
