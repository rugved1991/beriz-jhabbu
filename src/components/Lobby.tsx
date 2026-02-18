import { useState } from 'react';
import { Player } from '../types';
import { validatePlayerName } from '../utils/validation';

interface LobbyProps {
  roomId: string;
  maxPlayers: number;
  players: Player[];
  isHost: boolean;
  onJoinRoom: (playerName: string, roomId?: string) => Promise<void>;
  onStartGame: () => Promise<void>;
}

/**
 * Calculate player position around a circular table
 * Based on design document positioning algorithm
 */
function calculatePlayerPosition(playerIndex: number, totalPlayers: number): { x: number; y: number } {
  const angle = (2 * Math.PI * playerIndex) / totalPlayers;
  // Use percentage-based positioning for responsive layout
  // Adjust radius based on number of players to prevent overlap
  const baseRadius = 35; // Base percentage from center
  const radiusAdjustment = totalPlayers <= 4 ? 0 : totalPlayers <= 8 ? 2 : 4;
  const radius = baseRadius + radiusAdjustment;
  
  return {
    x: 50 + radius * Math.cos(angle - Math.PI / 2), // Center at 50%, start at top
    y: 50 + radius * Math.sin(angle - Math.PI / 2)
  };
}

/**
 * Get avatar size based on number of players
 */
function getAvatarSize(totalPlayers: number): string {
  if (totalPlayers <= 4) return 'w-12 h-12';
  if (totalPlayers <= 8) return 'w-10 h-10';
  if (totalPlayers <= 12) return 'w-9 h-9';
  return 'w-8 h-8';
}

/**
 * Get font size for avatar based on number of players
 */
function getAvatarFontSize(totalPlayers: number): string {
  if (totalPlayers <= 4) return 'text-lg';
  if (totalPlayers <= 8) return 'text-base';
  if (totalPlayers <= 12) return 'text-sm';
  return 'text-xs';
}

/**
 * Get border width based on number of players
 */
function getBorderWidth(totalPlayers: number): string {
  if (totalPlayers <= 8) return 'border-2';
  return 'border';
}

export function Lobby({ roomId, maxPlayers, players, isHost, onJoinRoom, onStartGame }: LobbyProps) {
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleJoinRoom = async () => {
    // Validate player name
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid player name');
      return;
    }

    if (players.length >= maxPlayers) {
      setError('Room is full');
      return;
    }

    setError('');
    setIsJoining(true);
    
    try {
      await onJoinRoom(playerName.trim(), roomId);
      setHasJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }
    setError('');
    setIsStarting(true);
    
    try {
      await onStartGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setIsStarting(false);
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      const shareUrl = `${window.location.origin}/?room=${roomId}&name=`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/?room=${roomId}&name=`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
            Game Lobby
          </h1>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-gray-600">
              <div className="bg-green-50 border border-green-300 rounded px-4 py-2">
                <span className="text-sm font-medium">Room ID: </span>
                <span className="font-mono font-bold text-green-800">{roomId}</span>
              </div>
              <div className="bg-blue-50 border border-blue-300 rounded px-4 py-2">
                <span className="text-sm font-medium">Players: </span>
                <span className="font-bold text-blue-800">{players.length}/{maxPlayers}</span>
              </div>
            </div>
            <button
              onClick={handleCopyRoomCode}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Share Room Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Join form for non-joined players */}
        {!hasJoined && (
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Game</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="Enter your name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleJoinRoom}
                disabled={isJoining}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Player list */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Players</h2>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{player.name}</p>
                    <p className="text-xs text-gray-500">Position {player.position + 1}</p>
                  </div>
                </div>
                {player.isHost && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visual table representation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Table Positions</h2>
          <div className="relative w-full h-96 bg-gradient-to-br from-green-700 to-green-800 rounded-lg shadow-inner">
            {/* Center table */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-900 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Table</span>
            </div>

            {/* Player positions */}
            {players.map((player) => {
              const pos = calculatePlayerPosition(player.position, maxPlayers);
              const avatarSize = getAvatarSize(maxPlayers);
              const avatarFontSize = getAvatarFontSize(maxPlayers);
              const borderWidth = getBorderWidth(maxPlayers);
              
              return (
                <div
                  key={player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className={`${avatarSize} bg-white rounded-full flex items-center justify-center text-green-800 font-bold shadow-lg ${borderWidth} border-green-600 ${avatarFontSize}`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-medium mt-1 bg-black bg-opacity-50 px-2 py-1 rounded truncate max-w-[100px]">
                      {player.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start game button (host only) */}
        {isHost && hasJoined && (
          <div className="space-y-3">
            {/* Add bot player button for testing */}
            {players.length < maxPlayers && (
              <button
                onClick={() => onJoinRoom(`Bot ${players.length + 1}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                + Add Bot Player (for testing)
              </button>
            )}
            
            <button
              onClick={handleStartGame}
              disabled={players.length < 2 || isStarting}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg ${
                players.length < 2 || isStarting
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl'
              }`}
            >
              {isStarting ? 'Starting...' : players.length < 2 ? 'Waiting for players...' : 'Start Game'}
            </button>
          </div>
        )}

        {/* Waiting message for non-host players */}
        {!isHost && hasJoined && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
            <p className="text-blue-800">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
