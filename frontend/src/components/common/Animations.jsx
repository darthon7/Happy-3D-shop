import { motion, useReducedMotion } from 'framer-motion';

const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

const smoothTransition = {
  duration: 0.4,
  ease: [0.25, 1, 0.5, 1],
};

export const FadeInUp = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({ children, staggerDelay = 0.1, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideInLeft = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideInRight = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const TextReveal = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.span>
  );
};

export const HoverScale = ({ children, scale = 1.05, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={{ scale: shouldReduceMotion ? 1 : scale }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const GlowPulse = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={shouldReduceMotion ? {} : {
        boxShadow: [
          '0 0 20px rgba(201, 168, 76, 0.3)',
          '0 0 40px rgba(201, 168, 76, 0.5)',
          '0 0 20px rgba(201, 168, 76, 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const BounceIn = ({ children, delay = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={shouldReduceMotion ? { duration: 0 } : {
        duration: 0.6,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { springTransition, smoothTransition };
