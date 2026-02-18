import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameState, Card, CardPosition } from './types';
import { GameSetup } from './components/GameSetup';
import { Lobby } from './components/Lobby';
import Table from './components/Table';
import PlayerHand from './components/PlayerHand';
import GameOver from './components/GameOver';
import RulesModal from './components/RulesModal';
import JhabbuAnnouncement from './components/JhabbuAnnouncement';
import PhaseTransition from './components/PhaseTransition';
import ConnectionStatus from './components/ConnectionStatus';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorMessage from './components/ErrorMessage';
import { calculateDeckCount, generateDecks, dealCards } from './utils/deckUtils';
import { generateCardPosition } from './utils/cardPositionUtils';
import { formatCardPlayError } from './utils/validation';
import { isBot, botSelectPhase1Card, botSelectPhase2Cards, getBotDelay } from './utils/botAI';
import { processJhabbuPlay } from './utils/jhabbuHelper';
import { socketManager, ConnectionStatus as ConnectionStatusType } from './services/SocketManager';

function App() {
  // Global game state
  const [gameState, setGameState] = useState<GameState>({
    phase: 'SETUP',
    roomId: '',
    hostId: '',
    maxPlayers: 0,
    players: [],
    currentPlayerIndex: 0,
    dealerId: '', // Will be set when game starts
    table: [],
    leadSuit: null,
    trickCards: [],
    loser: null
  });

  // Card positions for messy pile
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());

  // Current player ID (simulating local player for single-device multiplayer)
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Error message for card play validation
  const [cardPlayError, setCardPlayError] = useState<string>('');

  // Global error message (for network errors, room errors, etc.)
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('disconnected');

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');

  // Rules modal state
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Bot thinking state (prevents user clicks during bot delay)
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  // Jhabbu auto-play state (for playing the lowest card after Jhabbu)
  const [jhabbuAutoPlay, setJhabbuAutoPlay] = useState<{
    playerId: string;
    cardId: string; // Store card ID instead of card object
  } | null>(null);
  
  // Flag to allow auto-play to bypass the jhabbuAutoPlay check
  const isExecutingAutoPlay = React.useRef(false);

  // Jhabbu announcement state (for dramatic display)
  const [jhabbuAnnouncement, setJhabbuAnnouncement] = useState<{
    jhabbuGiver: string;
    jhabbuReceiver: string;
    cardCount: number;
  } | null>(null);

  // Phase transition state (for Phase 1 to Phase 2 transition)
  const [showPhaseTransition, setShowPhaseTransition] = useState<boolean>(false);

  /**
   * Socket Manager: Initialize connection and event listeners
   */
  useEffect(() => {
    // Connect to server
    socketManager.connect();

    // Track connection status
    setConnectionStatus(socketManager.getConnectionStatus());
    socketManager.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Setup event listeners
    socketManager.onGameStateUpdated(({ gameState: newGameState, event }) => {
      console.log('Game state updated from server:', { event, phase: newGameState.phase });
      setGameState(newGameState);
      
      // Update card positions based on the event
      if (event === 'cardPlayed') {
        // Add position for newly played card(s)
        const newCards = newGameState.phase === 'JHABBU' 
          ? newGameState.trickCards.map((tc: any) => tc.card)
          : newGameState.table;
        
        setCardPositions(currentPositions => {
          const newPositions = new Map(currentPositions);
          newCards.forEach((card: any) => {
            if (!newPositions.has(card.id)) {
              const position = generateCardPosition(Array.from(newPositions.values()));
              newPositions.set(card.id, position);
            }
          });
          return newPositions;
        });
      } else if (event === 'trickComplete' || event === 'phaseTransition') {
        // Clear card positions when trick completes or phase changes
        setCardPositions(new Map());
        if (event === 'phaseTransition') {
          setShowPhaseTransition(true);
        }
      } else if (event === 'jhabbuAnnouncement') {
        // Jhabbu announcement will be handled by the game state update
        console.log('Jhabbu announcement event received');
        // Clear card positions for new trick
        setCardPositions(new Map());
      }
    });

    socketManager.onPlayerJoined(({ players }) => {
      console.log('Player joined, updating player list');
      setGameState(prev => ({ ...prev, players }));
    });

    socketManager.onGameStarted(({ gameState: newGameState }) => {
      console.log('Game started from server');
      setGameState(newGameState);
    });

    // Attempt to reconnect if session exists in localStorage
    const attemptReconnection = async () => {
      const storedSessionId = localStorage.getItem('sessionId');
      const storedRoomId = localStorage.getItem('roomId');
      
      if (storedSessionId && storedRoomId) {
        console.log('Found stored session, attempting reconnection...', { storedRoomId, storedSessionId });
        setIsLoading(true);
        setLoadingMessage('Reconnecting to your game...');
        
        try {
          // Try to rejoin with the stored session
          const { playerId, gameState: serverGameState } = await socketManager.joinRoom(
            storedRoomId,
            'Reconnecting...', // Placeholder name, server should use existing player name
            storedSessionId
          );
          
          console.log('Reconnection successful!', { roomId: storedRoomId, playerId });
          setGameState(serverGameState);
          setCurrentUserId(playerId);
        } catch (error) {
          console.log('Reconnection failed, clearing stored session:', error);
          // Clear invalid session data
          localStorage.removeItem('sessionId');
          localStorage.removeItem('roomId');
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Check for URL parameters (join room via link)
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdParam = urlParams.get('room');
    const playerNameParam = urlParams.get('name');
    
    if (roomIdParam && playerNameParam) {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Join room after connection
      const joinFromUrl = async () => {
        setIsLoading(true);
        setLoadingMessage('Joining room...');
        try {
          await handleJoinRoom(playerNameParam);
        } catch (error) {
          console.error('Failed to join from URL:', error);
          setGlobalError('Failed to join room. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      // Set room ID and wait for connection
      setGameState(prev => ({ ...prev, roomId: roomIdParam }));
      
      if (socketManager.isConnected()) {
        joinFromUrl();
      } else {
        socketManager.onConnect(() => {
          joinFromUrl();
        });
      }
      
      return () => {
        socketManager.disconnect();
      };
    }

    // Wait for connection before attempting reconnection
    if (socketManager.isConnected()) {
      attemptReconnection();
    } else {
      socketManager.onConnect(() => {
        attemptReconnection();
      });
    }

    // Cleanup on unmount
    return () => {
      socketManager.disconnect();
    };
  }, []);

  /**
   * Bot AI: Automatically play for bot players (temporary local implementation)
   * NOTE: This will be replaced by server-side bot logic in Task 12
   * For now, bots still play locally but send moves through the socket
   */
  useEffect(() => {
    // Only run during active game phases
    if (gameState.phase !== 'BERIZ' && gameState.phase !== 'JHABBU') {
      setIsBotThinking(false);
      return;
    }

    // Pause bot AI during Jhabbu announcement
    if (jhabbuAnnouncement) {
      setIsBotThinking(false);
      return;
    }

    // Check if current player is a bot
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    console.log('Bot AI Check:', {
      phase: gameState.phase,
      currentPlayerIndex: gameState.currentPlayerIndex,
      currentPlayer: currentPlayer ? {
        name: currentPlayer.name,
        isBot: isBot(currentPlayer),
        isActive: currentPlayer.isActive,
        handSize: currentPlayer.hand.length
      } : 'undefined'
    });

    if (!currentPlayer || !isBot(currentPlayer) || !currentPlayer.isActive) {
      setIsBotThinking(false);
      return;
    }

    // Set bot thinking state to prevent user clicks
    setIsBotThinking(true);

    // Schedule bot move after a delay
    const timeoutId = setTimeout(async () => {
      // Get current state snapshot
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // Verify it's still a bot's turn
      if (!currentPlayer || !isBot(currentPlayer)) {
        setIsBotThinking(false);
        return;
      }

      try {
        if (gameState.phase === 'BERIZ') {
          // Bot plays in Phase 1
          const cardToPlay = botSelectPhase1Card(currentPlayer, gameState);
          
          // Send bot move through socket (will be validated by server)
          await handlePlayCard(cardToPlay);
          setIsBotThinking(false);
        } else if (gameState.phase === 'JHABBU') {
          // Bot plays in Phase 2
          const cardsToPlay = botSelectPhase2Cards(currentPlayer, gameState);
          if (cardsToPlay.length === 0) {
            console.error('Bot has no cards but is still active');
            setIsBotThinking(false);
            return;
          }

          // Smart Jhabbu: If multiple cards selected, keep lowest and give rest as Jhabbu
          let finalCardsToPlay: Card[];

          if (cardsToPlay.length > 1) {
            const { jhabbuCards } = processJhabbuPlay(cardsToPlay);
            finalCardsToPlay = jhabbuCards;
            
            console.log('Bot Smart Jhabbu Processing:', {
              botName: currentPlayer.name,
              selectedCards: cardsToPlay.map(c => `${c.rank}${c.suit}`),
              jhabbuCards: jhabbuCards.map(c => `${c.rank}${c.suit}`)
            });
          } else {
            finalCardsToPlay = cardsToPlay;
          }

          // Send bot move through socket (will be validated by server)
          await handlePlayCard(finalCardsToPlay);
          setIsBotThinking(false);
        }
      } catch (error) {
        console.error('Bot AI error:', error);
        setIsBotThinking(false);
      }
    }, getBotDelay());

    return () => {
      clearTimeout(timeoutId);
      setIsBotThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.phase, gameState.currentPlayerIndex, gameState.trickCards, jhabbuAnnouncement ? 'active' : null]);

  /**
   * Jhabbu Auto-Play: Automatically play the lowest card after giving Jhabbu
   */
  useEffect(() => {
      console.log('Jhabbu Auto-Play Effect:', {
      hasJhabbuAutoPlay: !!jhabbuAutoPlay,
      phase: gameState.phase,
      currentPlayerIndex: gameState.currentPlayerIndex,
      jhabbuAutoPlayDetails: jhabbuAutoPlay ? {
        playerId: jhabbuAutoPlay.playerId,
        cardId: jhabbuAutoPlay.cardId
      } : null
    });
    
    if (!jhabbuAutoPlay || gameState.phase !== 'JHABBU') {
      return;
    }

    // Check if it's the Jhabbu giver's turn (they should lead next)
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    console.log('Checking if auto-play should trigger:', {
      currentPlayer: currentPlayer ? {
        id: currentPlayer.id,
        name: currentPlayer.name
      } : null,
      jhabbuPlayerId: jhabbuAutoPlay.playerId,
      match: currentPlayer?.id === jhabbuAutoPlay.playerId
    });
    
    if (!currentPlayer || currentPlayer.id !== jhabbuAutoPlay.playerId) {
      // Not their turn yet, wait
      console.log('Not the Jhabbu giver\'s turn yet, waiting...');
      return;
    }

    // Set a delay for dramatic effect (500ms - plays quickly after announcement)
    const timeoutId = setTimeout(() => {
      // Find the card in the current player's hand
      const cardToPlay = currentPlayer.hand.find(c => c.id === jhabbuAutoPlay.cardId);
      
      if (!cardToPlay) {
        console.error('Jhabbu Auto-Play: Card not found in hand', {
          cardId: jhabbuAutoPlay.cardId,
          handCards: currentPlayer.hand.map(c => `${c.id}: ${c.rank}${c.suit}`)
        });
        setJhabbuAutoPlay(null);
        return;
      }
      
      console.log('Jhabbu Auto-Play: Executing auto-play', {
        player: currentPlayer.name,
        card: `${cardToPlay.rank}${cardToPlay.suit}`,
        cardId: cardToPlay.id
      });

      // Set flag to allow auto-play to bypass the check
      isExecutingAutoPlay.current = true;
      
      // Clear jhabbuAutoPlay and any error messages
      setJhabbuAutoPlay(null);
      setCardPlayError('');
      
      // Play the lowest card automatically immediately (no need for setTimeout)
      handlePlayCard(cardToPlay);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jhabbuAutoPlay, gameState.phase, gameState.currentPlayerIndex]);

  /**
   * Clear error message when jhabbuAutoPlay is cleared
   */
  useEffect(() => {
    if (!jhabbuAutoPlay && cardPlayError === 'Jhabbu auto-play in progress...') {
      setCardPlayError('');
    }
  }, [jhabbuAutoPlay, cardPlayError]);

  /**
   * Handle room creation (Requirements 4.1, 15.2)
   */
  const handleCreateRoom = useCallback(async (playerCount: number): Promise<string> => {
    setIsLoading(true);
    setLoadingMessage('Creating room...');
    setGlobalError(null);
    
    try {
      const { roomId, sessionId } = await socketManager.createRoom(playerCount);
      
      // Store session ID in localStorage for reconnection
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('roomId', roomId);
      
      // Update local state to show lobby
      setGameState(prev => ({
        ...prev,
        phase: 'LOBBY',
        roomId,
        maxPlayers: playerCount
      }));

      setCurrentUserId(sessionId);

      return roomId;
    } catch (error) {
      console.error('Failed to create room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      setGlobalError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle player joining room (Requirements 4.2, 15.3)
   */
  const handleJoinRoom = useCallback(async (playerName: string) => {
    setIsLoading(true);
    setLoadingMessage('Joining room...');
    setGlobalError(null);
    
    try {
      // Check for existing session ID in localStorage
      const storedSessionId = localStorage.getItem('sessionId');
      const storedRoomId = localStorage.getItem('roomId') || gameState.roomId;
      
      const { sessionId, playerId, gameState: serverGameState } = await socketManager.joinRoom(
        storedRoomId,
        playerName,
        storedSessionId || undefined
      );
      
      // Store session ID in localStorage for reconnection
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('roomId', storedRoomId);
      
      // Update local state with server game state
      setGameState(serverGameState);
      setCurrentUserId(playerId);
      
      console.log('Joined room successfully:', { roomId: storedRoomId, playerId, sessionId });
    } catch (error) {
      console.error('Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      setGlobalError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [gameState.roomId]);

  /**
   * Handle game start - emit to server (Requirements 4.4)
   */
  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Starting game...');
    setGlobalError(null);
    
    try {
      const roomId = localStorage.getItem('roomId') || gameState.roomId;
      await socketManager.startGame(roomId, currentUserId);
      
      console.log('Game start request sent to server');
      // Game state will be updated via onGameStarted event listener
    } catch (error) {
      console.error('Failed to start game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      setGlobalError(errorMessage);
      setCardPlayError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [gameState.roomId, currentUserId]);

  /**
   * Handle card play - emit to server (Requirements 4.4)
   */
  const handlePlayCard = useCallback(async (cardOrCards: Card | Card[]) => {
    console.log('handlePlayCard called:', {
      cardOrCards: Array.isArray(cardOrCards) 
        ? cardOrCards.map(c => `${c.rank}${c.suit}`)
        : `${cardOrCards.rank}${cardOrCards.suit}`,
      isBotThinking,
      hasJhabbuAutoPlay: !!jhabbuAutoPlay,
      isExecutingAutoPlay: isExecutingAutoPlay.current,
      phase: gameState.phase
    });
    
    // Prevent play if bot is thinking or Jhabbu auto-play is pending (unless this IS the auto-play)
    if (!isExecutingAutoPlay.current && (isBotThinking || jhabbuAutoPlay)) {
      console.log('handlePlayCard blocked:', {
        reason: jhabbuAutoPlay ? 'Jhabbu auto-play in progress' : 'Bot is thinking'
      });
      setCardPlayError(jhabbuAutoPlay ? 'Jhabbu auto-play in progress...' : 'Please wait for the bot to finish playing...');
      return;
    }
    
    // Clear the auto-play flag
    isExecutingAutoPlay.current = false;

    // Clear any previous error
    setCardPlayError('');

    // Normalize to array
    const cards = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];

    try {
      const roomId = localStorage.getItem('roomId') || gameState.roomId;
      await socketManager.playCard(roomId, currentUserId, cards);
      
      console.log('Card play sent to server');
      // Game state will be updated via onGameStateUpdated event listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play card';
      setCardPlayError(formatCardPlayError(errorMessage));
      console.error('Card play failed:', error);
    }
  }, [gameState.roomId, currentUserId, isBotThinking, jhabbuAutoPlay, gameState.phase]);

  /**
   * Handle game restart - reset game state and start a new round
   */
  const handleRestartGame = useCallback(() => {
    // Directly start a new game from GAME_OVER
    // Create new state starting from GAME_OVER
    let newState: GameState = {
      ...gameState,
      phase: 'DEALING',
      currentPlayerIndex: 0,
      table: [],
      leadSuit: null,
      trickCards: [],
      loser: null
    };

    // Determine the dealer (rotate to next player)
    let dealerId: string;
    if (gameState.dealerId) {
      // Rotate to the next player clockwise
      const currentDealerIndex = gameState.players.findIndex(p => p.id === gameState.dealerId);
      const nextDealerIndex = (currentDealerIndex + 1) % gameState.players.length;
      dealerId = gameState.players[nextDealerIndex].id;
      console.log('Restart game - Dealer rotated:', {
        previousDealerIndex: currentDealerIndex,
        newDealerIndex: nextDealerIndex,
        newDealerId: dealerId,
        newDealerName: gameState.players[nextDealerIndex].name
      });
    } else {
      // First game - randomly select a dealer
      const randomDealerIndex = Math.floor(Math.random() * gameState.players.length);
      dealerId = gameState.players[randomDealerIndex].id;
      console.log('Restart game - Random dealer selected:', {
        dealerIndex: randomDealerIndex,
        dealerId,
        dealerName: gameState.players[randomDealerIndex].name
      });
    }
    
    newState.dealerId = dealerId;

    // Calculate deck count and generate cards
    const deckCount = calculateDeckCount(gameState.players.length);
    const deck = generateDecks(deckCount);

    // Deal cards to players
    const hands = dealCards(deck, gameState.players.length);

    // Update players with their hands and reset their state
    const updatedPlayers = gameState.players.map((player, index) => ({
      ...player,
      hand: hands[index],
      sideDeck: [],
      isActive: true
    }));

    newState = {
      ...newState,
      players: updatedPlayers
    };

    // Transition to BERIZ phase
    newState = {
      ...newState,
      phase: 'BERIZ'
    };

    setGameState(newState);
    
    // Clear card positions
    setCardPositions(new Map());
    setCardPlayError('');
    setIsBotThinking(false);
  }, [gameState]);

  // Render appropriate component based on phase
  if (gameState.phase === 'SETUP') {
    return (
      <>
        <GameSetup onCreateRoom={handleCreateRoom} />
        <ConnectionStatus status={connectionStatus} />
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
        <ErrorMessage error={globalError} onDismiss={() => setGlobalError(null)} />
      </>
    );
  }

  if (gameState.phase === 'LOBBY') {
    const isHost = currentUserId === gameState.hostId;
    return (
      <>
        <Lobby
          roomId={gameState.roomId}
          maxPlayers={gameState.maxPlayers}
          players={gameState.players}
          isHost={isHost}
          onJoinRoom={handleJoinRoom}
          onStartGame={handleStartGame}
        />
        <ConnectionStatus status={connectionStatus} />
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
        <ErrorMessage error={globalError} onDismiss={() => setGlobalError(null)} />
      </>
    );
  }

  if (gameState.phase === 'GAME_OVER') {
    const loser = gameState.players.find(p => p.id === gameState.loser);
    const winners = gameState.players.filter(p => p.id !== gameState.loser);

    console.log('Game Over - Displaying results:', {
      loserId: gameState.loser,
      loserName: loser?.name,
      winnerCount: winners.length,
      winners: winners.map(w => w.name)
    });

    return (
      <>
        <GameOver
          loser={loser}
          winners={winners}
          onNewGame={handleRestartGame}
        />
        <ConnectionStatus status={connectionStatus} />
        <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
        <ErrorMessage error={globalError} onDismiss={() => setGlobalError(null)} />
      </>
    );
  }

  // BERIZ or JHABBU phase - render game board
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const localPlayer = gameState.players.find(p => p.id === currentUserId) || gameState.players[0];
  const effectiveUserId = localPlayer?.id || currentUserId;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 overflow-auto">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-2 sm:p-3">
        {/* Compact Game header */}
        <header className="bg-white rounded-lg shadow-lg p-2 sm:p-3 mb-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex-shrink-0 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Beriz Jhabbu</h1>
              <p className="text-xs text-gray-600 truncate">
                <span className="font-mono font-bold">{gameState.roomId}</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <p className="text-xs text-gray-600">Phase</p>
              <p 
                className="text-sm sm:text-base font-bold text-green-700"
                role="status"
                aria-live="polite"
              >
                {gameState.phase === 'BERIZ' ? 'Beriz' : 'Jhabbu'}
              </p>
            </div>
            <div className="flex-shrink-0 text-center min-w-0">
              <p className="text-xs text-gray-600">Turn</p>
              <p 
                className="text-sm sm:text-base font-bold text-blue-700 truncate"
                role="status"
                aria-live="polite"
              >
                {currentPlayer?.name}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsRulesOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 sm:py-1.5 sm:px-3 rounded shadow text-xs sm:text-sm"
                aria-label="View game rules"
              >
                📖 Rules
              </button>
            </div>
          </div>
        </header>

        {/* Game content */}
        <main className="flex-shrink-0">
          {/* Table area with fixed reasonable height */}
          <div className="mb-2" style={{ height: '400px' }}>
            <Table
              cards={gameState.phase === 'JHABBU' ? gameState.trickCards.map(tc => tc.card) : gameState.table}
              cardPositions={cardPositions}
              phase={gameState.phase}
              players={gameState.players}
              currentPlayerId={currentPlayer?.id}
              localPlayerId={effectiveUserId}
              dealerId={gameState.dealerId}
            />
          </div>

          {/* Status messages - compact */}
          <div className="flex-shrink-0">
            {/* Bot thinking indicator */}
            {isBotThinking && (
              <div 
                className="mb-1 bg-blue-50 border border-blue-300 rounded p-1.5 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs text-blue-800 font-semibold">
                  🤖 {currentPlayer?.name} is thinking...
                </p>
              </div>
            )}

            {/* Jhabbu auto-play indicator */}
            {jhabbuAutoPlay && localPlayer && (() => {
              const cardToPlay = localPlayer.hand.find(c => c.id === jhabbuAutoPlay.cardId);
              if (!cardToPlay) return null;
              
              return (
                <div 
                  className="mb-1 bg-purple-50 border border-purple-300 rounded p-1.5 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs text-purple-800 font-semibold">
                    🎴 Playing {cardToPlay.rank}{cardToPlay.suit === 'hearts' ? '♥' : cardToPlay.suit === 'diamonds' ? '♦' : cardToPlay.suit === 'clubs' ? '♣' : '♠'}...
                  </p>
                </div>
              );
            })()}

            {/* Card play error message */}
            {cardPlayError && (
              <div 
                className="mb-1 bg-red-50 border-2 border-red-400 rounded p-2 shadow-lg"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-xs sm:text-sm text-red-800 font-semibold text-center">
                  ⚠️ {cardPlayError}
                </p>
              </div>
            )}
          </div>

          {/* Player hand */}
          {localPlayer && (
            <div className="flex-shrink-0 mb-4">
              <PlayerHand
                player={localPlayer}
                isCurrentPlayer={currentPlayer?.id === effectiveUserId && !isBotThinking && !jhabbuAutoPlay}
                onPlayCard={handlePlayCard}
                phase={gameState.phase}
                gameState={gameState}
              />
            </div>
          )}
        </main>
      </div>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Jhabbu Announcement */}
      {jhabbuAnnouncement && (
        <JhabbuAnnouncement
          jhabbuGiver={jhabbuAnnouncement.jhabbuGiver}
          jhabbuReceiver={jhabbuAnnouncement.jhabbuReceiver}
          cardCount={jhabbuAnnouncement.cardCount}
          onComplete={() => setJhabbuAnnouncement(null)}
        />
      )}

      {/* Phase Transition */}
      {showPhaseTransition && (
        <PhaseTransition
          players={gameState.players}
          onComplete={() => setShowPhaseTransition(false)}
        />
      )}

      {/* Global UI Components */}
      <ConnectionStatus 
        status={connectionStatus} 
        onReconnectSuccess={() => {
          // Clear any errors on successful reconnection
          setGlobalError(null);
        }}
      />
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <ErrorMessage error={globalError} onDismiss={() => setGlobalError(null)} />
    </div>
  );
}

export default App;
