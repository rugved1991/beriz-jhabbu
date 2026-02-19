import React from 'react';
import { Player } from '../types';

interface GameOverProps {
  loser: Player | undefined;
  winners: Player[];
  onNewGame: () => void;
}

/**
 * GameOver Component
 * 
 * Displays the game over screen with:
 * - The loser (last player with cards remaining)
 * - All winners (players who emptied their side decks) sorted by finish position
 * - Final standings
 * - New Game button to restart
 * 
 * Requirements: 12.4
 */
const GameOver: React.FC<GameOverProps> = ({ loser, winners, onNewGame }) => {
  // Sort winners by finish position (1st, 2nd, 3rd, etc.)
  const sortedWinners = [...winners].sort((a, b) => {
    const posA = a.finishPosition ?? 999;
    const posB = b.finishPosition ?? 999;
    return posA - posB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Game Over!</h1>
        
        {/* Loser Display */}
        <div className="mb-8 bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-800 text-center mb-2">Loser</h2>
          <p className="text-3xl font-bold text-center text-red-900">
            {loser?.name || 'Unknown'}
          </p>
          <p className="text-sm text-center text-red-700 mt-2">
            Last player with cards remaining
          </p>
        </div>

        {/* Winners Display */}
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-800 text-center mb-4">Winners</h2>
          <div className="space-y-2">
            {sortedWinners.map((winner) => (
              <div 
                key={winner.id} 
                className="bg-white rounded p-3 flex items-center justify-between shadow-sm"
              >
                <span className="font-semibold text-gray-800">{winner.name}</span>
                <span className="text-sm text-green-600 font-medium">
                  {winner.finishPosition === 1 && '🥇 1st Place'}
                  {winner.finishPosition === 2 && '🥈 2nd Place'}
                  {winner.finishPosition === 3 && '🥉 3rd Place'}
                  {winner.finishPosition && winner.finishPosition > 3 && `${winner.finishPosition}th Place`}
                  {!winner.finishPosition && '✓ Winner'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Standings Summary */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Final Standings</h3>
          <div className="text-center text-gray-600">
            <p className="text-sm">
              <span className="font-semibold">{winners.length}</span> winner{winners.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm">
              <span className="font-semibold">1</span> loser
            </p>
          </div>
        </div>

        {/* Back to Lobby Button */}
        <button
          onClick={onNewGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Back to Setup
        </button>
      </div>
    </div>
  );
};

export default GameOver;
