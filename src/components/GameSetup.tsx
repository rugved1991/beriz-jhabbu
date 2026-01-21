import { useState } from 'react';
import { validatePlayerCount } from '../utils/validation';

interface GameSetupProps {
  onCreateRoom: (playerCount: number) => string; // Returns room ID
}

export function GameSetup({ onCreateRoom }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState<string>('4');
  const [error, setError] = useState<string>('');

  const handleCreateRoom = () => {
    const count = parseInt(playerCount, 10);
    
    // Validate player count (Requirements 1.4)
    const validation = validatePlayerCount(count);
    if (!validation.valid) {
      setError(validation.error || 'Invalid player count');
      return;
    }

    setError('');
    onCreateRoom(count);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
          Beriz Jhabbu
        </h1>
        <p className="text-gray-700 mb-8 text-center">
          Create a new game room
        </p>

        <form 
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateRoom();
          }}
        >
          <div>
            <label 
              htmlFor="playerCount" 
              className="block text-sm font-medium text-gray-800 mb-2"
            >
              Number of Players (2-16)
            </label>
            <input
              id="playerCount"
              type="number"
              min="2"
              max="16"
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-400 focus:border-green-500 focus:outline-none"
              placeholder="Enter number of players"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'player-count-error' : undefined}
            />
          </div>

          {error && (
            <div 
              id="player-count-error"
              className="bg-red-50 border border-red-400 rounded-lg p-3"
              role="alert"
            >
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400"
            aria-label="Create game room"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
}
