import React from 'react';
import { motion } from 'framer-motion';

function EqoFlowLoader({ size = "md" }) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Logo */}
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <motion.img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/adc75d39b_EqoFlowLogoDesign-14.png" 
          alt="EqoFlow Logo" 
          className={`${sizeClasses[size]} object-contain`}
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))',
              'drop-shadow(0 0 30px rgba(59, 130, 246, 0.6))',
              'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  );
}

export default EqoFlowLoader;
export { EqoFlowLoader, EqoFlowLoader as QuantumFlowLoader };