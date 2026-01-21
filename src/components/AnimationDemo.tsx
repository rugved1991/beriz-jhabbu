import React, { useState } from 'react';
import { Card as CardType, CardPosition } from '../types';
import Table from './Table';
import { AnimationType } from './Card';
import { createAnimationMap } from '../utils/animationUtils';

/**
 * Demo component to showcase card animations
 * This component demonstrates the three main animation types:
 * 1. Play animation (hand to table)
 * 2. Collect penalty animation (table to side deck)
 * 3. Collect trick animation (table to hand)
 */
const AnimationDemo: React.FC = () => {
  const [tableCards, setTableCards] = useState<CardType[]>([]);
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());
  const [cardAnimations, setCardAnimations] = useState<Map<string, AnimationType>>(new Map());

  // Sample cards for demo
  const sampleCards: CardType[] = [
    { suit: 'hearts', rank: 'A', id: 'hearts-A-demo1' },
    { suit: 'diamonds', rank: 'K', id: 'diamonds-K-demo1' },
    { suit: 'clubs', rank: '7', id: 'clubs-7-demo1' },
    { suit: 'spades', rank: 'Q', id: 'spades-Q-demo1' },
  ];

  // Generate random position for a card
  const generatePosition = (): CardPosition => {
    const centerX = 0;
    const centerY = 0;
    const offsetRange = 20;
    
    return {
      x: centerX + (Math.random() * offsetRange * 2 - offsetRange),
      y: centerY + (Math.random() * offsetRange * 2 - offsetRange),
      rotation: Math.random() * 30 - 15,
      zIndex: tableCards.length + 1
    };
  };

  // Add a card to the table with play animation
  const handlePlayCard = () => {
    const cardIndex = tableCards.length % sampleCards.length;
    const card = sampleCards[cardIndex];
    const newCard = { ...card, id: `${card.id}-${Date.now()}` };
    
    // Add card to table
    setTableCards(prev => [...prev, newCard]);
    
    // Set position
    setCardPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(newCard.id, generatePosition());
      return newPositions;
    });
    
    // Set play animation
    setCardAnimations(prev => {
      const newAnimations = new Map(prev);
      newAnimations.set(newCard.id, 'play');
      return newAnimations;
    });
    
    // Clear animation after it completes
    setTimeout(() => {
      setCardAnimations(prev => {
        const newAnimations = new Map(prev);
        newAnimations.set(newCard.id, 'none');
        return newAnimations;
      });
    }, 500);
  };

  // Collect all cards with penalty animation
  const handleCollectPenalty = () => {
    if (tableCards.length === 0) return;
    
    // Set penalty animation for all cards
    const animMap = createAnimationMap(
      tableCards.map(c => c.id),
      'collect-penalty'
    );
    setCardAnimations(animMap);
    
    // Remove cards after animation completes
    setTimeout(() => {
      setTableCards([]);
      setCardPositions(new Map());
      setCardAnimations(new Map());
    }, 600);
  };

  // Collect all cards with trick animation
  const handleCollectTrick = () => {
    if (tableCards.length === 0) return;
    
    // Set trick animation for all cards
    const animMap = createAnimationMap(
      tableCards.map(c => c.id),
      'collect-trick'
    );
    setCardAnimations(animMap);
    
    // Remove cards after animation completes
    setTimeout(() => {
      setTableCards([]);
      setCardPositions(new Map());
      setCardAnimations(new Map());
    }, 700);
  };

  // Clear all cards without animation
  const handleClearTable = () => {
    setTableCards([]);
    setCardPositions(new Map());
    setCardAnimations(new Map());
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Card Animation Demo
        </h1>
        
        <div className="mb-6">
          <Table
            cards={tableCards}
            cardPositions={cardPositions}
            phase="BERIZ"
            cardAnimations={cardAnimations}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handlePlayCard}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Play Card (Hand → Table)
          </button>
          
          <button
            onClick={handleCollectPenalty}
            disabled={tableCards.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Collect Penalty (Table → Side Deck)
          </button>
          
          <button
            onClick={handleCollectTrick}
            disabled={tableCards.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Collect Trick (Table → Hand)
          </button>
          
          <button
            onClick={handleClearTable}
            disabled={tableCards.length === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Table
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Animation Types</h2>
          <ul className="space-y-3">
            <li>
              <strong className="text-blue-400">Play Animation:</strong> Card scales up slightly then settles on the table (400ms)
            </li>
            <li>
              <strong className="text-red-400">Penalty Collection:</strong> Cards shrink and fade out as they move to side deck (500ms)
            </li>
            <li>
              <strong className="text-green-400">Trick Collection:</strong> Cards pulse and fade as they move to winner's hand (600ms)
            </li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Cards on table: <span className="text-white font-bold">{tableCards.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationDemo;
