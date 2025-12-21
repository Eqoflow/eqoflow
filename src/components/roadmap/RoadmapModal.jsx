
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Rocket, CheckCircle, Flag, Building2, Smartphone, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const roadmapData = [
  {
    phase: 'Phase 1 (We Are Here)',
    title: 'Foundation & Growth',
    status: 'next',
    icon: Rocket,
    points: [
      { text: 'Core Social Features & Engagement Economy', completed: true },
      { text: 'Community & DAO Governance Launch', completed: true },
      { text: 'Web-based Platform Optimization', completed: true },
      { text: 'Mobile-Friendly Web Experience', completed: false },
      { text: 'Blockchain Wallet Integration', completed: true },
      { text: 'Earn $QFLOW Tokens (1:1 conversion at DEX launch)', completed: true },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Ecosystem Expansion',
    status: 'future',
    icon: Building2,
    points: [
      { text: 'Full-Scale Streaming Platform (OBS Integration)', completed: false },
      { text: 'Immersive 3D Virtual Spaces', completed: false },
      { text: 'Advanced Creator Monetization Tools', completed: false },
      { text: 'DEX Listing & ICO Launch', completed: false },
    ],
    note: 'Requires successful investment round',
  },
  {
    phase: 'Phase 3',
    title: 'Mainstream Adoption',
    status: 'future',
    icon: Smartphone,
    points: [
      { text: 'Native Mobile Apps (iOS & Android)', completed: false },
      { text: 'Transition to Fully Autonomous DAO', completed: false },
      { text: 'Deep Decentralized Identity (DID) Integration', completed: false },
    ],
    note: 'Target: Post-100k Active Users',
  },
];

const statusStyles = {
  complete: {
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    badge: 'bg-green-600/20 text-green-300 border-green-500/30'
  },
  next: {
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    borderColor: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    textColor: 'text-purple-400',
    badge: 'bg-purple-600/20 text-purple-300 border-purple-500/30'
  },
  future: {
    iconBg: 'bg-gray-700',
    iconColor: 'text-gray-400',
    borderColor: 'border-gray-600',
    textColor: 'text-gray-500',
    badge: 'bg-gray-600/20 text-gray-400 border-gray-500/30'
  },
};

const RoadmapItem = ({ item, isLast, index }) => {
  const styles = statusStyles[item.status];
  const Icon = item.icon;
  const isCurrentPhase = item.status === 'next';

  return (
    <motion.div 
      className="relative flex items-start gap-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        ease: "easeOut"
      }}
    >
      {/* Timeline Column */}
      <div className="flex flex-col items-center h-full">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: index * 0.2 + 0.3,
            type: 'spring',
            stiffness: 200
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.borderColor} border-2 relative`}
        >
          {item.status === 'complete' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 + 0.5, duration: 0.3 }}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 + 0.5, duration: 0.3 }}
            >
              <Icon className={`w-6 h-6 ${styles.iconColor}`} />
            </motion.div>
          )}
          
          {/* Pulsing effect for next phase */}
          {item.status === 'next' && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-400"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
        {!isLast && (
          <motion.div 
            className="w-0.5 flex-grow bg-gray-700 my-2"
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.2 + 0.6,
              ease: "easeOut"
            }}
          />
        )}
      </div>

      {/* Content Column */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: index * 0.2 + 0.4,
          ease: "easeOut"
        }}
        className="flex-1 pb-10"
      >
        <motion.p 
          className={`font-bold ${styles.textColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.2 + 0.6 }}
        >
          {item.phase}
        </motion.p>
        <motion.h3 
          className="text-xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.2 + 0.7 }}
        >
          {item.title}
        </motion.h3>
        <motion.ul 
          className="space-y-3 text-gray-300 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.2 + 0.8 }}
        >
          {item.points.map((point, pointIndex) => (
            <motion.li 
              key={pointIndex}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: index * 0.2 + 0.9 + pointIndex * 0.1,
                duration: 0.4
              }}
            >
              {point.completed ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : isCurrentPhase ? (
                <motion.div
                    className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Circle className="w-full h-full fill-current" />
                </motion.div>
              ) : (
                <Circle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              )}
              <span className={`${point.completed ? "text-gray-500 line-through" : "text-gray-200"} flex-1`}>
                {point.text}
              </span>
            </motion.li>
          ))}
        </motion.ul>
        {item.note && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2 + 1.2 }}
          >
            <Badge className={styles.badge}>{item.note}</Badge>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default function RoadmapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card max-h-[90vh] flex flex-col overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
                  >
                    <Flag className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    EqoFlow Roadmap
                  </motion.span>
                </CardTitle>
                <motion.div
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </CardHeader>
            </motion.div>
            <CardContent className="overflow-y-auto pr-6 pl-8 py-6">
              <div className="flex flex-col">
                {roadmapData.map((item, index) => (
                  <RoadmapItem 
                    key={item.phase} 
                    item={item} 
                    isLast={index === roadmapData.length - 1}
                    index={index}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
