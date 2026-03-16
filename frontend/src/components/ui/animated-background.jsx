import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = ({ children }) => {
  return (
    <div className="relative w-full min-h-screen bg-background-dark overflow-clip selection:bg-primary/30">
      {/* Texture overlay (Noise/Grain) for premium streetwear feel */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* Core glow */}
        <div className="absolute inset-0 bg-background-dark [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        {/* Animated Mesh Blobs */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[80px] bg-primary/20 mix-blend-screen"
        />
        
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full blur-[80px] bg-purple-600/20 mix-blend-screen"
        />

        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: 'transform' }}
          className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[30vw] rounded-full blur-[100px] bg-indigo-900/30 mix-blend-screen"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
