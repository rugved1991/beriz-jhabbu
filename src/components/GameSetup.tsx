import { useState, useEffect } from 'react';
import { validatePlayerCount } from '../utils/validation';

interface GameSetupProps {
  onCreateRoom: (playerCount: number) => Promise<string>; // Returns room ID
  initialRoomId?: string; // Pre-filled room ID from URL
}

export function GameSetup({ onCreateRoom, initialRoomId }: GameSetupProps) {
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [playerCount, setPlayerCount] = useState<string>('4');
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Update roomId if initialRoomId changes
  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setMode('join');
    }
  }, [initialRoomId]);

  const handleCreateRoom = async () => {
    const count = parseInt(playerCount, 10);
    
    // Validate player count (Requirements 1.4)
    const validation = validatePlayerCount(count);
    if (!validation.valid) {
      setError(validation.error || 'Invalid player count');
      return;
    }

    setError('');
    setIsCreating(true);
    
    try {
      await onCreateRoom(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setError('');
    // Navigate to lobby with room ID only - user will enter name there
    window.location.href = `/?room=${roomId.toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
          Beriz Jhabbu
        </h1>
        <p className="text-gray-700 mb-6 text-center">
          Online Multiplayer Card Game
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('create');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'create'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setMode('join');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'join'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Join Room
          </button>
        </div>

        {mode === 'create' ? (
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
              disabled={isCreating}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Create game room"
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        ) : (
          <form 
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinRoom();
            }}
          >
            <div>
              <label 
                htmlFor="roomId" 
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Room ID
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-400 focus:border-green-500 focus:outline-none uppercase"
                placeholder="Enter 6-character room ID"
                maxLength={6}
                aria-required="true"
              />
            </div>

            {error && (
              <div 
                className="bg-red-50 border border-red-400 rounded-lg p-3"
                role="alert"
              >
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400"
              aria-label="Join game room"
            >
              Join Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
