import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, CardPosition } from '../types';

export type AnimationType = 'play' | 'collect-penalty' | 'collect-trick' | 'none';

interface CardProps {
  card: CardType;
  position?: CardPosition;
  onClick?: () => void;
  isPlayable?: boolean;
  animationType?: AnimationType;
  onAnimationComplete?: () => void;
  isOnTable?: boolean; // Whether card is on the table (vs in hand)
}

const Card: React.FC<CardProps> = ({ 
  card, 
  position, 
  onClick, 
  isPlayable = false,
  animationType = 'none',
  onAnimationComplete,
  isOnTable = false
}) => {
  // Map suits to symbols and colors
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  const suitColors: Record<string, string> = {
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
    clubs: 'text-black',
    spades: 'text-black'
  };

  // Define animation variants based on animation type
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'play':
        // Card play animation (hand to table) - optimized for 60fps
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { 
            scale: [1, 1.2, 1],
            opacity: 1,
            transition: { 
              duration: 0.3,
              ease: 'easeOut' as const
            }
          },
          exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
        };
      
      case 'collect-penalty':
        // Penalty collection animation (table to side deck) - optimized for 60fps
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { 
            scale: [1, 0.8, 0],
            opacity: [1, 1, 0],
            transition: { 
              duration: 0.4,
              ease: 'easeIn' as const
            }
          },
          exit: { opacity: 0, scale: 0 }
        };
      
      case 'collect-trick':
        // Trick collection animation (table to hand) - optimized for 60fps
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { 
            scale: [1, 1.1, 0.9, 0],
            opacity: [1, 1, 1, 0],
            transition: { 
              duration: 0.5,
              ease: 'easeInOut' as const
            }
          },
          exit: { opacity: 0, scale: 0 }
        };
      
      default:
        // No animation
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: 1, opacity: 1 },
          exit: { opacity: 1, scale: 1 }
        };
    }
  };

  const variants = getAnimationVariants();

  // Apply position and rotation transforms if provided
  // Use CSS transforms for GPU acceleration
  const transformStyle = position
    ? {
        transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${position.rotation}deg)`,
        zIndex: position.zIndex,
        willChange: 'transform'
      }
    : {};

  return (
    <motion.div
      className={`
        relative bg-white rounded border-2 sm:rounded-lg border-gray-800
        flex flex-col items-center justify-center
        shadow-lg
        ${isPlayable ? 'cursor-pointer hover:scale-105 hover:shadow-xl transition-transform' : ''}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      style={{
        ...transformStyle,
        // Responsive card sizing: smaller on mobile, larger on desktop
        // Mobile: 40x60px for table, 44x66px for hand
        // Desktop: 48x72px for both
        width: window.innerWidth < 640 ? (isOnTable ? '2.5rem' : '2.75rem') : '3rem',
        height: window.innerWidth < 640 ? (isOnTable ? '3.75rem' : '4.125rem') : '4.5rem'
      }}
      onClick={isPlayable && onClick ? onClick : undefined}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      onAnimationComplete={onAnimationComplete}
      role={onClick ? "button" : "img"}
      aria-label={`${card.rank} of ${card.suit}`}
      aria-disabled={!isPlayable}
      tabIndex={isPlayable ? 0 : -1}
      onKeyDown={(e) => {
        if (isPlayable && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Rank in top-left corner */}
      <div className={`absolute top-0.5 left-0.5 text-[10px] sm:text-xs font-bold ${suitColors[card.suit]}`} aria-hidden="true">
        {card.rank}
      </div>

      {/* Suit symbol in center */}
      <div className={`text-xl sm:text-2xl ${suitColors[card.suit]}`} aria-hidden="true">
        {suitSymbols[card.suit]}
      </div>

      {/* Rank in bottom-right corner (upside down) */}
      <div className={`absolute bottom-0.5 right-0.5 text-[10px] sm:text-xs font-bold ${suitColors[card.suit]} rotate-180`} aria-hidden="true">
        {card.rank}
      </div>
    </motion.div>
  );
};

// Memoize Card component to prevent unnecessary re-renders
export default memo(Card, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.animationType === nextProps.animationType &&
    prevProps.position?.x === nextProps.position?.x &&
    prevProps.position?.y === nextProps.position?.y &&
    prevProps.position?.rotation === nextProps.position?.rotation &&
    prevProps.position?.zIndex === nextProps.position?.zIndex
  );
});
