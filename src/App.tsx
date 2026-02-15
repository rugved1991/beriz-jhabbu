import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameState, Player, Card, CardPosition } from './types';
import { GameSetup } from './components/GameSetup';
import { Lobby } from './components/Lobby';
import Table from './components/Table';
import PlayerHand from './components/PlayerHand';
import GameOver from './components/GameOver';
import RulesModal from './components/RulesModal';
import JhabbuAnnouncement from './components/JhabbuAnnouncement';
import PhaseTransition from './components/PhaseTransition';
import { generateRoomId } from './utils/roomUtils';
import { calculateDeckCount, generateDecks, dealCards } from './utils/deckUtils';
import { generateCardPosition } from './utils/cardPositionUtils';
import { transitionToPhase } from './utils/stateMachine';
import { handlePhase1CardPlay, handlePhase1Completion } from './utils/phase1Logic';
import { handlePhase2TrickWithElimination, transitionToPhase2 } from './utils/phase2Logic';
import { formatCardPlayError } from './utils/validation';
import { isBot, botSelectPhase1Card, botSelectPhase2Cards, getBotDelay } from './utils/botAI';
import { processJhabbuPlay } from './utils/jhabbuHelper';

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
   * Bot AI: Automatically play for bot players
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
    const timeoutId = setTimeout(() => {
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
          
          const result = handlePhase1CardPlay(
            currentPlayer.id,
            cardToPlay,
            gameState.players,
            gameState.table
          );

          if (!result.success) {
            console.error('Bot card play failed:', result.error);
            setIsBotThinking(false);
            return;
          }

          // Update card positions FIRST, before game state
          setCardPositions(currentPositions => {
            let newPositions = new Map(currentPositions);
            
            if (result.penaltyCards) {
              // Penalty occurred - remove positions for collected cards
              result.penaltyCards.forEach(card => {
                newPositions.delete(card.id);
              });
            } else {
              // No penalty - add position for the played card
              const position = generateCardPosition(Array.from(newPositions.values()));
              newPositions.set(cardToPlay!.id, position);
            }
            
            return newPositions;
          });

          // Update game state
          let newState: GameState = {
            ...gameState,
            players: result.updatedPlayers,
            table: result.updatedTable
          };

          // Check if Phase 1 is complete
          if (result.phase1Complete) {
            // Move remaining table cards to last player
            const finalPlayers = handlePhase1Completion(
              currentPlayer.id,
              result.updatedPlayers,
              result.updatedTable
            );

            // Prepare for Phase 2 - use finalPlayers, not result.updatedPlayers
            const phase2Players = transitionToPhase2(finalPlayers);

            // Show phase transition announcement
            setShowPhaseTransition(true);

            // Update newState with phase2Players BEFORE transition
            newState = {
              ...newState,
              players: phase2Players,
              table: [],
              leadSuit: null,
              trickCards: []
            };

            // Now transition to JHABBU with updated players
            newState = transitionToPhase(newState, 'JHABBU');
            setCardPositions(new Map()); // Clear table positions
          }

          // Move to next player
          const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
          newState.currentPlayerIndex = nextPlayerIndex;

          setGameState(newState);
          setIsBotThinking(false);
        } else if (gameState.phase === 'JHABBU') {
          // Bot plays in Phase 2
          const cardsToPlay = botSelectPhase2Cards(currentPlayer, gameState);
          if (cardsToPlay.length === 0) {
            // Bot has no cards - should not happen if isActive check works
            console.error('Bot has no cards but is still active');
            setIsBotThinking(false);
            return;
          }

          // Smart Jhabbu: If multiple cards selected, keep lowest and give rest as Jhabbu
          let finalCardsToPlay: Card[];
          let lowestCardToKeep: Card | null = null;

          if (cardsToPlay.length > 1) {
            const { jhabbuCards, lowestCard } = processJhabbuPlay(cardsToPlay);
            finalCardsToPlay = jhabbuCards;
            lowestCardToKeep = lowestCard;
            
            console.log('Bot Smart Jhabbu Processing:', {
              botName: currentPlayer.name,
              selectedCards: cardsToPlay.map(c => `${c.rank}${c.suit}`),
              jhabbuCards: jhabbuCards.map(c => `${c.rank}${c.suit}`),
              lowestCard: `${lowestCard.rank}${lowestCard.suit}`
            });
          } else {
            finalCardsToPlay = cardsToPlay;
          }

          // Handle the bot's Phase 2 play
          const expectedPlayerId = gameState.players[gameState.currentPlayerIndex].id;

          const result = handlePhase2TrickWithElimination(
            currentPlayer.id,
            finalCardsToPlay,
            gameState.players,
            gameState.trickCards,
            gameState.leadSuit,
            expectedPlayerId
          );

          if (!result.success) {
            console.error('Bot card play failed:', result.error);
            setIsBotThinking(false);
            return;
          }

          // Update card positions for Phase 2
          setCardPositions(currentPositions => {
            let newPositions = new Map(currentPositions);
            
            if (result.trickComplete) {
              // Trick is complete - clear all positions
              return new Map();
            } else {
              // Add positions for all played cards
              finalCardsToPlay.forEach(card => {
                const position = generateCardPosition(Array.from(newPositions.values()));
                newPositions.set(card.id, position);
              });
              return newPositions;
            }
          });

          let newState: GameState = {
            ...gameState,
            players: result.updatedPlayers,
            trickCards: result.updatedTrickCards,
            leadSuit: result.leadSuit
          };

          // If trick is complete, update leader
          if (result.trickComplete && result.nextLeaderId) {
            const nextLeaderIndex = newState.players.findIndex(p => p.id === result.nextLeaderId);
            newState.currentPlayerIndex = nextLeaderIndex;
            newState.leadSuit = null;
            
            // If this was a Jhabbu dump, show announcement
            if (result.wasJhabbu && result.jhabbuGiverId && result.trickWinnerId) {
              const jhabbuGiverName = gameState.players.find(p => p.id === result.jhabbuGiverId)?.name || 'Unknown';
              const jhabbuReceiverName = gameState.players.find(p => p.id === result.trickWinnerId)?.name || 'Unknown';
              
              setJhabbuAnnouncement({
                jhabbuGiver: jhabbuGiverName,
                jhabbuReceiver: jhabbuReceiverName,
                cardCount: result.jhabbuCardCount || 0
              });
              
              // If bot kept a lowest card, set up auto-play
              if (lowestCardToKeep && result.nextLeaderId === currentPlayer.id) {
                setJhabbuAutoPlay({
                  playerId: currentPlayer.id,
                  cardId: lowestCardToKeep.id // Store card ID instead of card object
                });
              }
            }
            
            console.log('Bot Phase 2 Trick Complete - Setting Next Leader:', {
              nextLeaderId: result.nextLeaderId,
              nextLeaderName: newState.players[nextLeaderIndex]?.name,
              nextLeaderIndex,
              trickCards: result.updatedTrickCards.length,
              wasJhabbu: result.wasJhabbu
            });
          } else {
            // Move to next active player
            let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            while (!gameState.players[nextPlayerIndex].isActive) {
              nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
            }
            newState.currentPlayerIndex = nextPlayerIndex;
          }

          // Check if game is over
          if (result.gameOver && result.loserId) {
            newState.loser = result.loserId;
            newState = transitionToPhase(newState, 'GAME_OVER');
          }

          setGameState(newState);
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
   * Handle room creation (Requirements 13.1)
   */
  const handleCreateRoom = useCallback((playerCount: number): string => {
    const roomId = generateRoomId();
    const hostId = `player-${Date.now()}`;

    setGameState({
      phase: 'LOBBY',
      roomId,
      hostId,
      maxPlayers: playerCount,
      players: [],
      currentPlayerIndex: 0,
      dealerId: '', // Will be set when game starts
      table: [],
      leadSuit: null,
      trickCards: [],
      loser: null
    });

    setCurrentUserId(hostId);

    return roomId;
  }, []);

  /**
   * Handle player joining room (Requirements 13.2)
   */
  const handleJoinRoom = useCallback((playerName: string) => {
    // Generate a unique player ID
    // If this is the host's first join and currentUserId matches hostId, use it
    // Otherwise, always generate a new unique ID
    const isHostFirstJoin = !currentUserId && gameState.hostId;
    const playerId = isHostFirstJoin 
      ? gameState.hostId 
      : `player-${Date.now()}-${Math.random()}`;
    
    const isHost = playerId === gameState.hostId;

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      sideDeck: [],
      isActive: true,
      isHost,
      position: gameState.players.length
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));

    // Only set currentUserId if it's not already set (for the host)
    if (!currentUserId) {
      setCurrentUserId(playerId);
    }
  }, [currentUserId, gameState.hostId, gameState.players.length]);

  /**
   * Handle game start - deal cards and transition to Phase 1
   */
  const handleStartGame = useCallback(() => {
    // Create new state starting from current gameState
    // If coming from GAME_OVER, we need to manually set to DEALING
    let newState: GameState;
    
    if (gameState.phase === 'GAME_OVER') {
      // Manual transition from GAME_OVER to DEALING (restart scenario)
      newState = {
        ...gameState,
        phase: 'DEALING',
        currentPlayerIndex: 0, // Will be set properly after dealer is determined
        table: [],
        leadSuit: null,
        trickCards: [],
        loser: null
      };
    } else {
      // Normal transition to DEALING phase
      newState = transitionToPhase(gameState, 'DEALING');
    }

    // Determine the dealer
    let dealerId: string;
    let dealerIndex: number;
    if (gameState.dealerId) {
      // If there's already a dealer, rotate to the next player clockwise
      const currentDealerIndex = gameState.players.findIndex(p => p.id === gameState.dealerId);
      dealerIndex = (currentDealerIndex + 1) % gameState.players.length;
      dealerId = gameState.players[dealerIndex].id;
    } else {
      // First game - randomly select a dealer
      dealerIndex = Math.floor(Math.random() * gameState.players.length);
      dealerId = gameState.players[dealerIndex].id;
      console.log('First game - Random dealer selected:', {
        dealerIndex,
        dealerId,
        dealerName: gameState.players[dealerIndex].name
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
      isActive: true,
      finishPosition: undefined // Reset finish position for new game
    }));

    newState = {
      ...newState,
      players: updatedPlayers
    };

    // Transition to BERIZ phase
    newState = transitionToPhase(newState, 'BERIZ');
    
    // Set starting player to the left of dealer (clockwise)
    const startingPlayerIndex = (dealerIndex + 1) % gameState.players.length;
    newState.currentPlayerIndex = startingPlayerIndex;

    setGameState(newState);
  }, [gameState]);

  /**
   * Handle card play - routes to Phase 1 or Phase 2 logic
   */
  const handlePlayCard = useCallback((cardOrCards: Card | Card[]) => {
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
    const card = cards[0]; // For Phase 1, always single card

    // Determine the effective user ID (fallback to first player if currentUserId is invalid)
    const localPlayer = gameState.players.find(p => p.id === currentUserId) || gameState.players[0];
    const effectiveUserId = localPlayer?.id || currentUserId;

    if (gameState.phase === 'BERIZ') {
      // Phase 1 logic
      const result = handlePhase1CardPlay(
        effectiveUserId,
        card,
        gameState.players,
        gameState.table
      );

      if (!result.success) {
        const errorMessage = formatCardPlayError(result.error || 'Card play failed');
        setCardPlayError(errorMessage);
        console.error('Card play failed:', result.error);
        return;
      }

      // Update card positions
      let newPositions = new Map(cardPositions);
      
      if (result.penaltyCards) {
        // Penalty occurred - remove positions for collected cards
        result.penaltyCards.forEach(penaltyCard => {
          newPositions.delete(penaltyCard.id);
        });
      } else {
        // No penalty - add position for the played card
        const position = generateCardPosition(Array.from(newPositions.values()));
        newPositions.set(card.id, position);
      }

      setCardPositions(newPositions);

      // Update game state
      let newState: GameState = {
        ...gameState,
        players: result.updatedPlayers,
        table: result.updatedTable
      };

      // Check if Phase 1 is complete
      if (result.phase1Complete) {
        // Move remaining table cards to last player (the one who just played)
        const finalPlayers = handlePhase1Completion(
          effectiveUserId,
          result.updatedPlayers,
          result.updatedTable
        );

        // Prepare for Phase 2
        const phase2Players = transitionToPhase2(finalPlayers);

        // Show phase transition announcement
        setShowPhaseTransition(true);

        // Transition to JHABBU phase
        newState = {
          ...newState,
          players: phase2Players,
          table: [],
          leadSuit: null,
          trickCards: []
        };

        newState = transitionToPhase(newState, 'JHABBU');
        setCardPositions(new Map()); // Clear table positions
      }

      // Move to next player
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      newState.currentPlayerIndex = nextPlayerIndex;

      setGameState(newState);
    } else if (gameState.phase === 'JHABBU') {
      // Phase 2 logic - support single card or multiple cards (Jhabbu dump)
      const expectedPlayerId = gameState.players[gameState.currentPlayerIndex].id;

      // Smart Jhabbu: If multiple cards selected, keep lowest and give rest as Jhabbu
      let cardsToPlay: Card[];
      let lowestCardToKeep: Card | null = null;

      if (cards.length > 1) {
        const { jhabbuCards, lowestCard } = processJhabbuPlay(cards);
        cardsToPlay = jhabbuCards;
        lowestCardToKeep = lowestCard;
        
        console.log('Smart Jhabbu Processing:', {
          selectedCards: cards.map(c => `${c.rank}${c.suit}`),
          jhabbuCards: jhabbuCards.map(c => `${c.rank}${c.suit}`),
          lowestCard: `${lowestCard.rank}${lowestCard.suit}`,
          playerId: effectiveUserId
        });
      } else {
        cardsToPlay = cards;
        console.log('Single card play (not Jhabbu):', {
          card: `${cards[0].rank}${cards[0].suit}`,
          playerId: effectiveUserId
        });
      }

      const result = handlePhase2TrickWithElimination(
        effectiveUserId,
        cardsToPlay,
        gameState.players,
        gameState.trickCards,
        gameState.leadSuit,
        expectedPlayerId
      );

      if (!result.success) {
        const errorMessage = formatCardPlayError(result.error || 'Card play failed');
        setCardPlayError(errorMessage);
        console.error('Phase 2 Card play failed - Setting error message:', {
          error: result.error,
          formattedError: errorMessage,
          playerId: effectiveUserId
        });
        return;
      }

      // Update card positions for Phase 2
      let newPositions = new Map(cardPositions);
      
      if (result.trickComplete) {
        // Trick is complete - clear all positions
        newPositions.clear();
        
        console.log('Trick Complete - Checking for Jhabbu auto-play:', {
          lowestCardToKeep: lowestCardToKeep ? `${lowestCardToKeep.rank}${lowestCardToKeep.suit}` : null,
          nextLeaderId: result.nextLeaderId,
          effectiveUserId,
          wasJhabbu: result.wasJhabbu,
          shouldAutoPlay: lowestCardToKeep && result.nextLeaderId === effectiveUserId
        });
        
        // If this was a Jhabbu dump, show announcement
        if (result.wasJhabbu && result.trickWinnerId) {
          const jhabbuReceiverName = gameState.players.find(p => p.id === result.trickWinnerId)?.name || 'Unknown';
          const jhabbuGiverName = localPlayer?.name || 'Unknown';
          
          console.log('Setting up Jhabbu announcement:', {
            jhabbuGiver: jhabbuGiverName,
            jhabbuReceiver: jhabbuReceiverName,
            cardCount: cardsToPlay.length,
            lowestCard: lowestCardToKeep ? `${lowestCardToKeep.rank}${lowestCardToKeep.suit}` : 'none (eliminated)',
            hasAutoPlay: !!lowestCardToKeep
          });
          
          setJhabbuAnnouncement({
            jhabbuGiver: jhabbuGiverName,
            jhabbuReceiver: jhabbuReceiverName,
            cardCount: cardsToPlay.length
          });
          
          // Set up auto-play only if there's a card to keep
          if (lowestCardToKeep && result.nextLeaderId === effectiveUserId) {
            console.log('Setting up Jhabbu auto-play:', {
              lowestCardId: lowestCardToKeep.id
            });
            
            setJhabbuAutoPlay({
              playerId: effectiveUserId,
              cardId: lowestCardToKeep.id // Store card ID instead of card object
            });
          }
        }
      } else {
        // Add positions for all played cards
        cardsToPlay.forEach(playedCard => {
          const position = generateCardPosition(Array.from(newPositions.values()));
          newPositions.set(playedCard.id, position);
        });
      }

      setCardPositions(newPositions);

      let newState: GameState = {
        ...gameState,
        players: result.updatedPlayers,
        trickCards: result.updatedTrickCards,
        leadSuit: result.leadSuit
      };

      // If trick is complete, update leader
      if (result.trickComplete && result.nextLeaderId) {
        const nextLeaderIndex = newState.players.findIndex(p => p.id === result.nextLeaderId);
        newState.currentPlayerIndex = nextLeaderIndex;
        newState.leadSuit = null; // Reset for next trick
        
        console.log('Phase 2 Trick Complete - Setting Next Leader:', {
          nextLeaderId: result.nextLeaderId,
          nextLeaderName: newState.players[nextLeaderIndex]?.name,
          nextLeaderIndex,
          trickCards: result.updatedTrickCards.length
        });
      } else {
        // Move to next active player
        let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        while (!gameState.players[nextPlayerIndex].isActive) {
          nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
        }
        newState.currentPlayerIndex = nextPlayerIndex;
      }

      // Check if game is over
      if (result.gameOver && result.loserId) {
        newState.loser = result.loserId;
        newState = transitionToPhase(newState, 'GAME_OVER');
      }

      setGameState(newState);
    }
  }, [gameState, currentUserId, cardPositions, isBotThinking, jhabbuAutoPlay]);

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
    return <GameSetup onCreateRoom={handleCreateRoom} />;
  }

  if (gameState.phase === 'LOBBY') {
    const isHost = currentUserId === gameState.hostId;
    return (
      <Lobby
        roomId={gameState.roomId}
        maxPlayers={gameState.maxPlayers}
        players={gameState.players}
        isHost={isHost}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
      />
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
      <GameOver
        loser={loser}
        winners={winners}
        onNewGame={handleRestartGame}
      />
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
    </div>
  );
}

export default App;
