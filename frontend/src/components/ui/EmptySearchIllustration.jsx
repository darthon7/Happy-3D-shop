import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export const EmptySearchIllustration = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, type: 'spring' }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="relative w-32 h-32 mb-6">
      <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75" />
      <div className="relative bg-surface border border-border rounded-full w-full h-full flex items-center justify-center shadow-2xl">
        <Search className="w-12 h-12 text-primary/60" />
      </div>
    </div>
    <h3 className="text-xl font-bold text-white mb-2">No encontramos resultados</h3>
    <p className="text-text-secondary text-sm max-w-[250px]">
      Intenta con otros términos de búsqueda o elimina algunos filtros para ver más productos.
    </p>
  </motion.div>
);
