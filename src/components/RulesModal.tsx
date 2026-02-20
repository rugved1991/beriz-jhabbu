import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 id="rules-title" className="text-2xl font-bold text-green-800">Game Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close rules"
          >
            ×
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Overview</h3>
            <p className="text-gray-700">
              Beriz Jhabbu is a card game for 2-16 players featuring two distinct phases. 
              The game uses multiple standard 52-card decks (one deck per 4 players). 
              The objective is to avoid being the last player with cards.
            </p>
          </section>

          {/* Setup */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Setup</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Choose number of players (2-16)</li>
              <li>Game automatically calculates required decks</li>
              <li>All cards are dealt to players</li>
              <li>Game begins with Phase 1</li>
            </ul>
          </section>

          {/* Phase 1 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Phase 1: Beriz (Addition Phase)</h3>
            <p className="text-gray-700 mb-2"><strong>Objective:</strong> Play all cards from your hand while avoiding penalties.</p>
            
            <div className="mb-3">
              <p className="font-semibold text-gray-800 mb-1">How to Play:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Players take turns playing one card to the center table</li>
                <li>Cards are placed randomly creating a "messy pile"</li>
                <li>After playing, check if you triggered a penalty</li>
              </ul>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
              <p className="font-semibold text-red-800 mb-2">Penalty Rules (Beriz):</p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-800">Duplicate Rank:</p>
                  <p className="text-gray-700">Your card's rank already exists on the table</p>
                  <p className="text-gray-600 italic">Example: You play a 7, and there's already a 7 on the table</p>
                  <p className="text-gray-700">You collect: Your played card + the matching card</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Sum Match (numbered cards only):</p>
                  <p className="text-gray-700">Your card's value equals the sum of other cards</p>
                  <p className="text-gray-600">Ace = 1, numbered cards = face value, face cards (J, Q, K) have no value</p>
                  <p className="text-gray-600 italic">Example: You play a 7, and the table has 2+5 or 3+4 or 1+2+4</p>
                  <p className="text-gray-700">You collect: Your played card + all cards in the longest matching combination</p>
                  <p className="text-gray-600">If multiple combinations match, you collect the one with the most cards</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">BOTH penalties can trigger simultaneously:</p>
                  <p className="text-gray-700">If both trigger, you collect ALL matching cards from both penalties</p>
                  <p className="text-gray-600 italic">Example: You play 10, table has another 10, 1, 2, 3, 4</p>
                  <ul className="list-disc list-inside text-gray-600 ml-4">
                    <li>Duplicate: The other 10 matches your rank</li>
                    <li>Sum: 1+2+3+4 = 10 matches your value</li>
                    <li>You collect: Your 10 + the other 10 + 1 + 2 + 3 + 4 = 6 cards total</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Face Cards (J, Q, K):</p>
                  <p className="text-gray-700">Only trigger duplicate rank penalties, never sum penalties</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-semibold text-gray-800 mb-1">What happens to penalty cards:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Collected cards go to your "side deck" (hidden from other players)</li>
                <li>Your side deck becomes your hand in Phase 2</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-3 rounded text-sm mt-2">
              <p className="font-semibold text-gray-800 mb-1">Phase 1 Ends:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>When the last player plays their final hand card</li>
                <li>That player collects all remaining table cards</li>
                <li>The table is cleared and Phase 2 begins</li>
              </ul>
            </div>
          </section>

          {/* Phase 2 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Phase 2: Jhabbu (Shedding Phase)</h3>
            <p className="text-gray-700 mb-2"><strong>Objective:</strong> Empty your hand (side deck from Phase 1) first. The last player with cards loses.</p>
            
            <div className="mb-3">
              <p className="font-semibold text-gray-800 mb-1">How to Play:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Your side deck becomes your hand</li>
                <li>Players play in rounds (tricks)</li>
                <li>First player plays a card - this suit becomes the "lead suit"</li>
                <li>All other players must follow the lead suit if they have it</li>
                <li>If you don't have the lead suit, you are "void" and can play any card</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-2">
              <p className="font-semibold text-blue-800 mb-1">Normal Round (No Jhabbu Dump):</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>All players play one card following suit rules</li>
                <li><strong>All cards are discarded</strong> (removed from game)</li>
                <li>Everyone successfully sheds their card</li>
                <li>Player with highest card of lead suit leads the next round</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-2">
              <p className="font-semibold text-yellow-800 mb-2">Jhabbu Dump Round:</p>
              <p className="text-gray-700 text-sm mb-2">When you're void in the lead suit, you can perform a "Jhabbu Dump":</p>
              <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm">
                <li>Select all cards of another suit (minimum 2 cards to trigger Jhabbu)</li>
                <li>System automatically keeps the lowest card of that suit for you</li>
                <li>System gives the remaining cards as Jhabbu to the Jhabbu Receiver</li>
                <li>"Jhabbu!!" announcement appears on screen</li>
                <li>Player with highest card of the lead suit becomes "Jhabbu Receiver"</li>
                <li>Jhabbu Receiver collects ALL cards from the round</li>
                <li>The trick ends immediately when Jhabbu is played</li>
                <li>You (Jhabbu Giver) lead the next round with your kept lowest card</li>
              </ol>
              <div className="mt-2 text-sm">
                <p className="font-semibold text-gray-800">Special cases:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>If you only have single cards of different suits, you can give Jhabbu with just one card</li>
                  <li>If you give Jhabbu with your last card, you are eliminated and the next active player leads</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-semibold text-gray-800 mb-1">Player Elimination:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>When your hand is empty, you're eliminated (you've won!)</li>
                <li>Eliminated players are skipped in turn order</li>
                <li>Game continues with remaining players</li>
              </ul>
            </div>
          </section>

          {/* Winning and Losing */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Winning and Losing</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li><strong>Winners:</strong> All players who empty their hands</li>
              <li><strong>Loser:</strong> The last player still holding cards</li>
              <li>Game ends when only one player has cards remaining</li>
            </ul>
          </section>

          {/* Card Rankings */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Card Rankings</h3>
            <p className="text-gray-700 text-sm mb-1"><strong>Highest to Lowest:</strong></p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li>Ace (highest in Phase 2 tricks, value of 1 in Phase 1 sums)</li>
              <li>King, Queen, Jack (no numeric value in Phase 1)</li>
              <li>10, 9, 8, 7, 6, 5, 4, 3, 2</li>
            </ul>
          </section>

          {/* Quick Reference */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Phase 1 (Beriz)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ Play cards from hand</li>
                  <li>❌ Avoid duplicate ranks</li>
                  <li>❌ Avoid sum matches</li>
                  <li>🎯 Goal: Empty your hand (but you'll collect penalties)</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Phase 2 (Jhabbu)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ Follow suit if possible</li>
                  <li>✅ Jhabbu Dump when void (offensive move)</li>
                  <li>❌ Avoid being Jhabbu Receiver</li>
                  <li>🎯 Goal: Empty your hand first</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Glossary */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Key Terms</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold text-gray-800">Beriz:</dt>
                <dd className="text-gray-700 ml-4">Penalty in Phase 1</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Jhabbu Dump:</dt>
                <dd className="text-gray-700 ml-4">Dumping multiple cards when void in lead suit</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Jhabbu Giver:</dt>
                <dd className="text-gray-700 ml-4">Player who dumps cards (offensive move)</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Jhabbu Receiver:</dt>
                <dd className="text-gray-700 ml-4">Player who must collect dumped cards</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Lead Suit:</dt>
                <dd className="text-gray-700 ml-4">Suit of the first card played in a round</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Void:</dt>
                <dd className="text-gray-700 ml-4">Having no cards of a particular suit</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-800">Side Deck:</dt>
                <dd className="text-gray-700 ml-4">Hidden penalty cards from Phase 1 that become your hand in Phase 2</dd>
              </div>
            </dl>
          </section>

          {/* Tip */}
          <section className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-800">
              <strong>💡 Tip:</strong> Phase 1 is about managing penalties. Phase 2 is about strategic card play and timing your Jhabbu Dumps!
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
