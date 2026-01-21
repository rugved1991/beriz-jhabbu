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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
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
              The objective is to avoid being the last player with cards.
            </p>
          </section>

          {/* Phase 1 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Phase 1: Beriz (Addition Phase)</h3>
            <p className="text-gray-700 mb-2"><strong>Objective:</strong> Play all cards from your hand while avoiding penalties.</p>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
              <p className="font-semibold text-red-800 mb-1">Penalty Rules (Beriz):</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Duplicate Rank:</strong> Your card's rank already exists on the table</li>
                <li><strong>Sum Match:</strong> Your card's value equals the sum of other cards (numbered cards only)</li>
                <li><strong>Face Cards (J, Q, K):</strong> Only trigger duplicate rank penalties</li>
              </ul>
            </div>
            
            <p className="text-gray-700">
              Collected penalty cards go to your "side deck" which becomes your hand in Phase 2.
            </p>
          </section>

          {/* Phase 2 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Phase 2: Jhabbu (Shedding Phase)</h3>
            <p className="text-gray-700 mb-2"><strong>Objective:</strong> Empty your hand first. The last player with cards loses.</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-2">
              <p className="font-semibold text-blue-800 mb-1">Normal Round:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Follow the lead suit if you have it</li>
                <li>All cards are <strong>discarded</strong> (removed from game)</li>
                <li>Highest card of lead suit leads next round</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold text-yellow-800 mb-1">Jhabbu Dump Round:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>When void in lead suit, dump all cards of another suit (keep lowest)</li>
                <li><strong>Call out "Jhabbu!!!"</strong> as you dump your cards</li>
                <li>Player with highest card of lead suit becomes "Jhabbu Receiver"</li>
                <li>Jhabbu Receiver collects ALL cards from the round</li>
                <li>You (Jhabbu Giver) lead the next round</li>
              </ul>
            </div>
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
                  <li>🎯 Goal: Empty your hand</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Phase 2 (Jhabbu)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ Follow suit if possible</li>
                  <li>✅ Jhabbu Dump when void</li>
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
