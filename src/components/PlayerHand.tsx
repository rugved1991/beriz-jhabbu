import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Player, Card as CardType, GamePhase, GameState } from '../types';
import Card from './Card';
import { sortCardsBySuitAndRank } from '../utils/cardSorting';
import { botSelectPhase1Card, botSelectPhase2Cards } from '../utils/botAI';

/**
 * Sort cards by rank only (ignoring suit) for Phase 1
 */
const sortCardsByRankOnly = (cards: CardType[]): CardType[] => {
  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  return [...cards].sort((a, b) => {
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });
};

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  onPlayCard: (cards: CardType | CardType[]) => void;
  phase: GamePhase;
  gameState: GameState;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  player, 
  isCurrentPlayer, 
  onPlayCard, 
  phase,
  gameState
}) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [sortPhase1, setSortPhase1] = useState<boolean>(false);
  const [hintCard, setHintCard] = useState<string | null>(null);

  // Sort cards by suit and rank in Phase 2 (Jhabbu) or by rank only in Phase 1 if sort is enabled
  const displayedHand = useMemo(() => {
    if (phase === 'JHABBU') {
      return sortCardsBySuitAndRank(player.hand);
    } else if (phase === 'BERIZ' && sortPhase1) {
      return sortCardsByRankOnly(player.hand);
    }
    return player.hand;
  }, [player.hand, phase, sortPhase1]);

  const handleCardClick = (card: CardType, event?: React.MouseEvent) => {
    // Prevent interaction if not current player or player is inactive
    if (!isCurrentPlayer || !player.isActive) {
      return;
    }

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    const isMultiSelectKey = event?.ctrlKey || event?.metaKey;

    // In Phase 1 (BERIZ), only allow single card selection
    if (phase === 'BERIZ') {
      setSelectedCards(prevSelected => {
        if (prevSelected.has(card.id)) {
          return new Set();
        } else {
          return new Set([card.id]);
        }
      });
    } else {
      // In Phase 2 (JHABBU), allow multiple card selection with Ctrl/Cmd key
      setSelectedCards(prevSelected => {
        const newSelection = new Set(prevSelected);
        
        if (isMultiSelectKey) {
          // Multi-select mode: toggle the clicked card
          if (newSelection.has(card.id)) {
            newSelection.delete(card.id);
          } else {
            newSelection.add(card.id);
          }
        } else {
          // Single-select mode: replace selection with just this card
          if (newSelection.size === 1 && newSelection.has(card.id)) {
            // If only this card is selected, deselect it
            newSelection.clear();
          } else {
            // Replace selection with just this card
            newSelection.clear();
            newSelection.add(card.id);
          }
        }
        
        return newSelection;
      });
    }
  };

  const handleShowHint = () => {
    if (!isCurrentPlayer || !player.isActive || player.hand.length === 0) {
      console.log('Hint: Cannot show hint', {
        isCurrentPlayer,
        isActive: player.isActive,
        handLength: player.hand.length
      });
      return;
    }

    console.log('Hint: Calculating best card', {
      phase,
      handSize: player.hand.length,
      tableSize: gameState.table.length,
      leadSuit: gameState.leadSuit
    });

    let suggestedCard: CardType;

    if (phase === 'BERIZ') {
      // Phase 1: Use bot AI to find a card that won't trigger penalty
      suggestedCard = botSelectPhase1Card(player, gameState);
      console.log('Hint (Phase 1): Suggested card to avoid penalty', {
        card: `${suggestedCard.rank} of ${suggestedCard.suit}`,
        tableCards: gameState.table.map(c => `${c.rank} of ${c.suit}`)
      });
    } else {
      // Phase 2: Use bot AI to follow suit or give Jhabbu strategically
      const suggestedCards = botSelectPhase2Cards(player, gameState);
      suggestedCard = suggestedCards[0]; // Take first card from bot's suggestion
      
      if (suggestedCards.length > 1) {
        console.log('Hint (Phase 2): Bot suggests Jhabbu with multiple cards', {
          cardCount: suggestedCards.length,
          cards: suggestedCards.map(c => `${c.rank} of ${c.suit}`),
          leadSuit: gameState.leadSuit
        });
      } else {
        console.log('Hint (Phase 2): Suggested card', {
          card: `${suggestedCard.rank} of ${suggestedCard.suit}`,
          leadSuit: gameState.leadSuit,
          followingSuit: suggestedCard.suit === gameState.leadSuit
        });
      }
    }

    setHintCard(suggestedCard.id);

    // Clear hint after 3 seconds
    setTimeout(() => {
      setHintCard(null);
    }, 3000);
  };

  const handlePlayCard = () => {
    // Double-check it's still your turn
    if (selectedCards.size === 0 || !isCurrentPlayer || !player.isActive) {
      return;
    }

    // Get all selected cards
    const cards = player.hand.filter(c => selectedCards.has(c.id));
    
    if (cards.length > 0) {
      // Pass single card or array based on selection
      onPlayCard(cards.length === 1 ? cards[0] : cards);
      setSelectedCards(new Set());
    }
  };

  return (
    <div 
      className="flex flex-col items-center space-y-2 sm:space-y-4 p-2 sm:p-4 bg-gray-800 rounded-lg shadow-lg"
      role="region"
      aria-label={`${player.name}'s hand`}
    >
      {/* Player info header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          {/* Player name and position */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-white">
              {player.name}
              {player.isHost && (
                <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded" role="status">
                  HOST
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">Position {player.position + 1}</p>
          </div>

          {/* Active/Eliminated status */}
          <div>
            {!player.isConnected && player.isConnected !== undefined ? (
              <span 
                className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full"
                role="status"
                aria-label="Player is disconnected"
              >
                DISCONNECTED
              </span>
            ) : player.isActive ? (
              <span 
                className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full"
                role="status"
                aria-label="Player is active"
              >
                ACTIVE
              </span>
            ) : (
              <span 
                className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full"
                role="status"
                aria-label="Player is eliminated"
              >
                ELIMINATED
              </span>
            )}
          </div>
        </div>

        {/* Side deck count, sort button, and hint button */}
        <div className="flex items-center space-x-3">
          {/* Hint button (only when it's player's turn) */}
          {isCurrentPlayer && player.isActive && (
            <button
              onClick={handleShowHint}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
              aria-label="Show hint for best card to play"
            >
              💡 Hint
            </button>
          )}
          
          {/* Sort button (Phase 1 only) */}
          {phase === 'BERIZ' && (
            <button
              onClick={() => setSortPhase1(!sortPhase1)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                sortPhase1 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              aria-label={sortPhase1 ? 'Unsort cards' : 'Sort cards by rank'}
            >
              {sortPhase1 ? '🔢 Sorted' : '🔀 Sort'}
            </button>
          )}
          
          {/* Side deck count */}
          <div 
            className="flex flex-col items-center bg-gray-700 px-4 py-2 rounded-lg"
            role="status"
            aria-label={`Side deck has ${player.sideDeck.length} cards`}
          >
            <p className="text-xs text-gray-400">Side Deck</p>
            <p className="text-2xl font-bold text-white">{player.sideDeck.length}</p>
          </div>
        </div>
      </div>

      {/* Hand cards display */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">
            Hand ({player.hand.length})
          </p>
          {isCurrentPlayer && player.isActive && (
            <p 
              className="text-xs text-yellow-400 font-semibold"
              role="status"
              aria-live="polite"
            >
              YOUR TURN
            </p>
          )}
        </div>

        {/* Cards container with AnimatePresence for smooth transitions */}
        <div 
          className="flex flex-wrap gap-2 min-h-[80px] p-2 bg-gray-900 rounded-lg"
          role="group"
          aria-label="Your cards"
        >
          {player.hand.length === 0 ? (
            <div className="w-full flex items-center justify-center text-gray-500 text-xs">
              No cards in hand
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedHand.map((card) => {
                const isSelected = selectedCards.has(card.id);
                const isHinted = hintCard === card.id;
                return (
                  <div
                    key={card.id}
                    className={`
                      transition-all duration-200 cursor-pointer
                      ${isSelected ? 'transform -translate-y-1 ring-2 ring-yellow-400' : ''}
                      ${isHinted ? 'ring-2 ring-purple-500 animate-pulse' : ''}
                      ${isCurrentPlayer && player.isActive ? 'hover:scale-105' : ''}
                    `}
                    onClick={(e) => handleCardClick(card, e)}
                  >
                    <Card
                      card={card}
                      isPlayable={isCurrentPlayer && player.isActive}
                    />
                  </div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Play card button */}
        {isCurrentPlayer && player.isActive && selectedCards.size > 0 && (
          <button
            onClick={handlePlayCard}
            className="mt-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            aria-label={`Play ${selectedCards.size} selected card${selectedCards.size > 1 ? 's' : ''}`}
          >
            {phase === 'JHABBU' && selectedCards.size > 1 
              ? `Give Jhabbu (${selectedCards.size} cards)` 
              : `Play Card${selectedCards.size > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Phase indicator for current player */}
      {isCurrentPlayer && player.isActive && phase === 'JHABBU' && (
        <div className="w-full text-center text-xs text-gray-400 mt-1" role="status">
          <div className="text-yellow-400">
            💡 Ctrl/Cmd + click for Jhabbu
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
