import { useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// ============================================
// 3D TILT HOOK - Mouse tracking perspective
// ============================================
export const useTilt3D = (options = {}) => {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
    glare = true,
    glareOpacity = 0.15,
  } = options;

  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Spring configuration for smooth motion
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const glareX = useSpring(50, springConfig);
  const glareY = useSpring(50, springConfig);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation based on mouse position
    const tiltX = (mouseY / (rect.height / 2)) * -maxTilt;
    const tiltY = (mouseX / (rect.width / 2)) * maxTilt;
    
    rotateX.set(tiltX);
    rotateY.set(tiltY);
    
    // Calculate glare position
    const glareXPos = ((e.clientX - rect.left) / rect.width) * 100;
    const glareYPos = ((e.clientY - rect.top) / rect.height) * 100;
    glareX.set(glareXPos);
    glareY.set(glareYPos);
  }, [maxTilt, rotateX, rotateY, glareX, glareY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  }, [rotateX, rotateY, glareX, glareY]);

  return {
    ref,
    isHovered,
    style: {
      perspective,
      transformStyle: 'preserve-3d',
    },
    motionStyle: {
      rotateX,
      rotateY,
      scale: isHovered ? scale : 1,
      transition: { duration: speed / 1000 },
    },
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    glare: glare ? {
      style: {
        background: useTransform(
          [glareX, glareY],
          ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${glareOpacity}), transparent 60%)`
        ),
      },
      isVisible: isHovered,
    } : null,
  };
};

// ============================================
// TILT3D CARD COMPONENT
// ============================================
export const Tilt3DCard = ({ 
  children, 
  className = '',
  maxTilt = 12,
  scale = 1.02,
  glare = true,
  glareOpacity = 0.12,
  perspective = 1000,
}) => {
  const { ref, style, motionStyle, handlers, glare: glareProps, isHovered } = useTilt3D({
    maxTilt,
    scale,
    glare,
    glareOpacity,
    perspective,
  });

  return (
    <div ref={ref} style={style} className={className}>
      <motion.div
        style={motionStyle}
        {...handlers}
        className="relative w-full h-full"
      >
        {children}
        
        {/* Glare overlay */}
        {glareProps && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-inherit z-10"
            style={{
              ...glareProps.style,
              opacity: glareProps.isVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderRadius: 'inherit',
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

// ============================================
// FLOATING ELEMENT - Parallax on scroll/mouse
// ============================================
export const Float3D = ({ 
  children, 
  className = '',
  intensity = 20,
  duration = 6,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -intensity, 0],
        rotateZ: [-1, 1, -1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// PARALLAX LAYER - Depth-based movement
// ============================================
export const ParallaxLayer = ({ 
  children, 
  className = '',
  depth = 0.5, // 0 = no movement, 1 = maximum
  direction = 'both', // 'x', 'y', 'both'
}) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const moveX = (e.clientX - centerX) * depth * 0.05;
    const moveY = (e.clientY - centerY) * depth * 0.05;
    
    setOffset({
      x: direction === 'y' ? 0 : moveX,
      y: direction === 'x' ? 0 : moveY,
    });
  }, [depth, direction]);

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      animate={{
        x: offset.x,
        y: offset.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// 3D FLIP CARD - Front/Back rotation
// ============================================
export const FlipCard3D = ({
  front,
  back,
  className = '',
  flipOnHover = true,
  flipOnClick = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (flipOnClick) setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{ perspective: 1000 }}
      onClick={handleFlip}
      onMouseEnter={flipOnHover ? () => setIsFlipped(true) : undefined}
      onMouseLeave={flipOnHover ? () => setIsFlipped(false) : undefined}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// 3D PERSPECTIVE TEXT
// ============================================
export const Perspective3DText = ({
  text,
  className = '',
  depth = 8,
  color = 'rgba(198,42,185, 0.3)',
}) => {
  const layers = Array.from({ length: depth }, (_, i) => i);
  
  return (
    <div className={`relative ${className}`} style={{ perspective: 500 }}>
      {/* Shadow layers */}
      {layers.map((_, i) => (
        <span
          key={i}
          className="absolute inset-0"
          style={{
            transform: `translateZ(${-i * 2}px)`,
            color: i === 0 ? 'inherit' : color,
            opacity: 1 - (i / depth) * 0.8,
            zIndex: -i,
          }}
          aria-hidden={i > 0}
        >
          {text}
        </span>
      ))}
      {/* Main text */}
      <span className="relative z-10">{text}</span>
    </div>
  );
};

// ============================================
// HOVER REVEAL 3D - Reveal content on hover
// ============================================
export const HoverReveal3D = ({
  children,
  revealContent,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: 800 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? -90 : 0,
          y: isHovered ? -20 : 0,
          opacity: isHovered ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformOrigin: 'top center' }}
      >
        {children}
      </motion.div>
      
      <motion.div
        className="absolute inset-0"
        initial={{ rotateX: 90, y: 20, opacity: 0 }}
        animate={{
          rotateX: isHovered ? 0 : 90,
          y: isHovered ? 0 : 20,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformOrigin: 'bottom center' }}
      >
        {revealContent}
      </motion.div>
    </div>
  );
};

// ============================================
// GLASS MORPHISM 3D CARD
// ============================================
export const Glass3DCard = ({
  children,
  className = '',
  blur = 20,
  opacity = 0.1,
  borderOpacity = 0.2,
}) => {
  const { ref, style, motionStyle, handlers, glare, isHovered } = useTilt3D({
    maxTilt: 8,
    scale: 1.01,
    glare: true,
    glareOpacity: 0.1,
  });

  return (
    <div ref={ref} style={style} className={className}>
      <motion.div
        style={motionStyle}
        {...handlers}
        className="relative w-full h-full rounded-2xl overflow-hidden"
      >
        {/* Glass background */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `rgba(255, 255, 255, ${opacity})`,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Glare */}
        {glare && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              ...glare.style,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
