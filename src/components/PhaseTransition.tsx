import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../types';

interface PhaseTransitionProps {
  players: Player[];
  onComplete: () => void;
}

const PhaseTransition: React.FC<PhaseTransitionProps> = ({
  players,
  onComplete
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide after 4 seconds
    const timer = setTimeout(() => {
      setShow(false);
      // Call onComplete after fade out animation
      setTimeout(onComplete, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Get active players (those with cards)
  const activePlayers = players.filter(p => p.isActive && p.hand.length > 0);
  const eliminatedPlayers = players.filter(p => !p.isActive || p.hand.length === 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 150,
              damping: 20
            }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-6 sm:p-10 max-w-3xl mx-4"
          >
            {/* Phase transition title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 drop-shadow-lg">
                Phase 1 Complete!
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 font-semibold">
                Moving to Phase 2: Jhabbu
              </p>
            </motion.div>

            {/* Explanation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white bg-opacity-10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm mb-6"
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 text-center">
                📚 Side Deck → Hand
              </h2>
              <p className="text-sm sm:text-base text-blue-50 text-center leading-relaxed">
                All penalty cards from your side deck are now in your hand.
                <br />
                <span className="font-semibold text-yellow-200">
                  Goal: Empty your hand first to win!
                </span>
              </p>
            </motion.div>

            {/* Player status */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {/* Active players */}
              {activePlayers.length > 0 && (
                <div className="bg-green-500 bg-opacity-20 rounded-xl p-3 sm:p-4 border-2 border-green-400">
                  <h3 className="text-sm sm:text-base font-bold text-green-100 mb-2">
                    ✅ Still Playing ({activePlayers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activePlayers.map(player => (
                      <div
                        key={player.id}
                        className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 backdrop-blur-sm"
                      >
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {player.name}
                        </p>
                        <p className="text-xs text-green-200">
                          {player.hand.length} card{player.hand.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eliminated players */}
              {eliminatedPlayers.length > 0 && (
                <div className="bg-gray-500 bg-opacity-20 rounded-xl p-3 sm:p-4 border-2 border-gray-400">
                  <h3 className="text-sm sm:text-base font-bold text-gray-100 mb-2">
                    🏆 Already Won ({eliminatedPlayers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {eliminatedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 backdrop-blur-sm"
                      >
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {player.name}
                        </p>
                        <p className="text-xs text-gray-200">
                          No penalties!
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Countdown indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-blue-200">
                Starting in a moment...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhaseTransition;
