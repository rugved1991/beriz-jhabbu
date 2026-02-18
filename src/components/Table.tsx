import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card as CardType, CardPosition, GamePhase, Player } from '../types';
import Card, { AnimationType } from './Card';
import PlayerPositions from './PlayerPositions';

interface TableProps {
  cards: CardType[];
  cardPositions: Map<string, CardPosition>;
  phase: GamePhase;
  players?: Player[];
  currentPlayerId?: string;
  localPlayerId?: string;
  dealerId?: string;
  cardAnimations?: Map<string, AnimationType>;
  onAnimationComplete?: (cardId: string) => void;
}

const Table: React.FC<TableProps> = ({ 
  cards, 
  cardPositions, 
  phase,
  players,
  currentPlayerId,
  localPlayerId,
  dealerId,
  cardAnimations,
  onAnimationComplete
}) => {
  // Adjust padding based on number of players
  const playerCount = players?.length || 0;
  const verticalPadding = playerCount <= 4 ? '40px' : playerCount <= 8 ? '50px' : '60px';
  const horizontalPadding = playerCount <= 4 ? '40px' : playerCount <= 8 ? '50px' : '60px';
  
  return (
    <div 
      className="relative w-full h-full flex items-center justify-center" 
      style={{ 
        paddingTop: verticalPadding, 
        paddingBottom: verticalPadding,
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding
      }}
    >
      <div 
        className="relative w-full h-full bg-green-700 rounded-xl sm:rounded-2xl shadow-2xl overflow-visible"
        style={{
          maxWidth: '1000px', // Increased from 800px to use more horizontal space
          margin: '0 auto'
        }}
        role="region"
        aria-label="Game table"
        aria-live="polite"
      >
        {/* Green felt texture effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 opacity-50 rounded-3xl"></div>
        
        {/* Subtle felt pattern */}
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,.1) 10px,
              rgba(0,0,0,.1) 20px
            )`
          }}
          aria-hidden="true"
        ></div>

        {/* Player positions around the table */}
        {players && currentPlayerId && localPlayerId && (
          <PlayerPositions 
            players={players}
            currentPlayerId={currentPlayerId}
            localPlayerId={localPlayerId}
            dealerId={dealerId}
          />
        )}

        {/* Cards container - positioned absolutely for spread effect */}
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => {
              const position = cardPositions.get(card.id);
              const animationType = cardAnimations?.get(card.id) || 'none';
              
              // Skip rendering if no position assigned yet
              if (!position) {
                console.warn(`Card ${card.rank}${card.suit} has no position assigned`);
                return null;
              }
              
              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) rotate(${position.rotation}deg)`,
                    zIndex: position.zIndex
                  }}
                >
                  <Card 
                    card={card} 
                    animationType={animationType}
                    onAnimationComplete={() => onAnimationComplete?.(card.id)}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Phase indicator (optional visual feedback) */}
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-green-900 text-xl font-semibold opacity-30">
              {phase === 'BERIZ' ? 'Play your cards...' : phase === 'JHABBU' ? 'Trick-taking phase' : ''}
            </p>
          </div>
        )}
        
        {/* Screen reader announcement for card count */}
        <div className="sr-only" aria-live="polite">
          {cards.length > 0 ? `${cards.length} cards on the table` : 'Table is empty'}
        </div>
      </div>
    </div>
  );
};

export default Table;
