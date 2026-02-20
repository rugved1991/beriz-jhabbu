import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JhabbuAnnouncementProps {
  jhabbuGiver: string;
  jhabbuReceiver: string;
  cardCount: number;
  leadSuit?: string;
  givenSuit?: string;
  onComplete: () => void;
}

const JhabbuAnnouncement: React.FC<JhabbuAnnouncementProps> = ({
  jhabbuGiver,
  jhabbuReceiver,
  cardCount,
  leadSuit,
  givenSuit,
  onComplete
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide after 2 seconds
    const timer = setTimeout(() => {
      setShow(false);
      // Call onComplete after fade out animation
      setTimeout(onComplete, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 sm:p-12 max-w-2xl mx-4"
          >
            {/* Main Jhabbu text */}
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl sm:text-8xl font-black text-white text-center mb-6 drop-shadow-lg"
              style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.3)' }}
            >
              🎴 JHABBU!! 🎴
            </motion.h1>

            {/* Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 text-center"
            >
              {/* Giver */}
              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm sm:text-base text-purple-100 font-semibold mb-1">
                  Jhabbu Giver
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {jhabbuGiver}
                </p>
                <p className="text-xs sm:text-sm text-purple-200 mt-1">
                  dumped {cardCount} {givenSuit ? `${givenSuit === 'hearts' ? '♥' : givenSuit === 'diamonds' ? '♦' : givenSuit === 'clubs' ? '♣' : '♠'} ` : ''}card{cardCount > 1 ? 's' : ''}
                </p>
                {leadSuit && givenSuit && (
                  <p className="text-xs text-purple-300 mt-1">
                    on {leadSuit === 'hearts' ? '♥' : leadSuit === 'diamonds' ? '♦' : leadSuit === 'clubs' ? '♣' : '♠'} lead
                  </p>
                )}
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ 
                  repeat: Infinity,
                  duration: 1,
                  ease: "easeInOut"
                }}
                className="text-4xl sm:text-5xl"
              >
                ⬇️
              </motion.div>

              {/* Receiver */}
              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm sm:text-base text-purple-100 font-semibold mb-1">
                  Jhabbu Receiver
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {jhabbuReceiver}
                </p>
                <p className="text-xs sm:text-sm text-purple-200 mt-1">
                  {leadSuit ? `(highest ${leadSuit === 'hearts' ? '♥' : leadSuit === 'diamonds' ? '♦' : leadSuit === 'clubs' ? '♣' : '♠'} card)` : '(highest card of lead suit)'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JhabbuAnnouncement;
