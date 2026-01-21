import React from 'react';
import { Player } from '../types';

interface PlayerPositionsProps {
  players: Player[];
  currentPlayerId: string;
  localPlayerId: string;
  dealerId?: string;
}

/**
 * Calculate player position around a circular table
 * Based on design document positioning algorithm
 * Positions players outside the table area
 * Adjusts positions so local player is always at the bottom
 */
function calculatePlayerPosition(
  playerIndex: number, 
  totalPlayers: number,
  localPlayerPosition: number
): { x: number; y: number } {
  // Calculate relative position (local player should be at bottom = position 0 in our view)
  const relativePosition = (playerIndex - localPlayerPosition + totalPlayers) % totalPlayers;
  
  // Start at bottom (Math.PI / 2) and go counter-clockwise
  const angle = (2 * Math.PI * relativePosition) / totalPlayers + Math.PI / 2;
  
  // Adjust radius based on number of players to prevent overlap
  const radius = totalPlayers <= 4 ? 55 : totalPlayers <= 8 ? 58 : 60;
  
  return {
    x: 50 + radius * Math.cos(angle), // Center at 50%
    y: 50 + radius * Math.sin(angle)
  };
}

/**
 * Get avatar size based on number of players
 */
function getAvatarSize(totalPlayers: number): string {
  if (totalPlayers <= 4) return 'w-14 h-14';
  if (totalPlayers <= 8) return 'w-12 h-12';
  if (totalPlayers <= 12) return 'w-10 h-10';
  return 'w-8 h-8';
}

/**
 * Get font size for avatar based on number of players
 */
function getAvatarFontSize(totalPlayers: number): string {
  if (totalPlayers <= 4) return 'text-xl';
  if (totalPlayers <= 8) return 'text-lg';
  if (totalPlayers <= 12) return 'text-base';
  return 'text-sm';
}

/**
 * Get border width based on number of players
 */
function getBorderWidth(totalPlayers: number): string {
  if (totalPlayers <= 8) return 'border-4';
  return 'border-2';
}

/**
 * Get name container size based on number of players
 */
function getNameContainerSize(totalPlayers: number): string {
  if (totalPlayers <= 4) return 'min-w-[100px] px-3 py-1';
  if (totalPlayers <= 8) return 'min-w-[90px] px-2 py-1';
  if (totalPlayers <= 12) return 'min-w-[80px] px-2 py-0.5';
  return 'min-w-[70px] px-1 py-0.5';
}

/**
 * Get name font size based on number of players
 */
function getNameFontSize(totalPlayers: number): string {
  if (totalPlayers <= 8) return 'text-xs';
  return 'text-[10px]';
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({ 
  players, 
  currentPlayerId,
  localPlayerId,
  dealerId
}) => {
  const totalPlayers = players.length;
  const avatarSize = getAvatarSize(totalPlayers);
  const avatarFontSize = getAvatarFontSize(totalPlayers);
  const borderWidth = getBorderWidth(totalPlayers);
  const nameContainerSize = getNameContainerSize(totalPlayers);
  const nameFontSize = getNameFontSize(totalPlayers);

  // Find local player's position to use as reference
  const localPlayer = players.find(p => p.id === localPlayerId);
  const localPlayerPosition = localPlayer?.position ?? 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {players.map((player) => {
        const pos = calculatePlayerPosition(player.position, totalPlayers, localPlayerPosition);
        const isCurrentPlayer = player.id === currentPlayerId;
        const isLocalPlayer = player.id === localPlayerId;
        const isDealer = dealerId ? player.id === dealerId : false;
        
        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%` 
            }}
          >
            <div className="flex flex-col items-center pointer-events-auto">
              {/* Player avatar */}
              <div 
                className={`
                  ${avatarSize} rounded-full flex items-center justify-center font-bold shadow-lg ${borderWidth} transition-all ${avatarFontSize}
                  ${isCurrentPlayer ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : 'border-white'}
                  ${!player.isActive ? 'bg-gray-400 text-gray-700' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'}
                  ${isLocalPlayer ? 'ring-2 ring-green-400' : ''}
                `}
                title={player.name}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Player name and info */}
              <div className={`mt-1 bg-black bg-opacity-75 rounded-lg text-center ${nameContainerSize}`}>
                <p className={`text-white ${nameFontSize} font-semibold truncate max-w-[120px]`}>
                  {player.name}
                  {isLocalPlayer && ' (You)'}
                  {isDealer && ' 🎴'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span className="text-white text-[10px]">
                    🃏 {player.hand.length}
                  </span>
                  {player.sideDeck.length > 0 && (
                    <span className="text-yellow-300 text-[10px]">
                      📚 {player.sideDeck.length}
                    </span>
                  )}
                </div>
                {!player.isActive && (
                  <span className="text-red-400 text-[10px] font-bold">
                    OUT
                  </span>
                )}
              </div>
              
              {/* Dealer indicator */}
              {isDealer && (
                <div className="mt-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  DEALER
                </div>
              )}
              
              {/* Current turn indicator */}
              {isCurrentPlayer && (
                <div className="mt-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                  TURN
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerPositions;
