import React from 'react';
import { ConnectionStatus as Status } from '../services/SocketManager';

interface ConnectionStatusProps {
  status: Status;
  onReconnectSuccess?: () => void;
}

/**
 * ConnectionStatus component displays the current connection state
 * Shows reconnecting indicator and success message on reconnection
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onReconnectSuccess }) => {
  const [showReconnectSuccess, setShowReconnectSuccess] = React.useState(false);
  const prevStatusRef = React.useRef<Status>(status);

  React.useEffect(() => {
    // Detect successful reconnection
    if (prevStatusRef.current === 'reconnecting' && status === 'connected') {
      setShowReconnectSuccess(true);
      onReconnectSuccess?.();
      
      // Hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowReconnectSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    prevStatusRef.current = status;
  }, [status, onReconnectSuccess]);

  // Show reconnecting indicator
  if (status === 'reconnecting') {
    return (
      <div 
        className="fixed top-4 right-4 z-50 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4 max-w-sm animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="animate-spin h-6 w-6 text-yellow-600" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              Reconnecting to server...
            </p>
            <p className="text-xs text-yellow-700">
              Please wait while we restore your connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show disconnected warning
  if (status === 'disconnected') {
    return (
      <div 
        className="fixed top-4 right-4 z-50 bg-red-50 border-2 border-red-400 rounded-lg shadow-lg p-4 max-w-sm"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Connection lost
            </p>
            <p className="text-xs text-red-700">
              Attempting to reconnect...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show reconnection success message
  if (showReconnectSuccess) {
    return (
      <div 
        className="fixed top-4 right-4 z-50 bg-green-50 border-2 border-green-400 rounded-lg shadow-lg p-4 max-w-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Reconnected successfully!
            </p>
            <p className="text-xs text-green-700">
              Your connection has been restored
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Connected - no indicator needed
  return null;
};

export default ConnectionStatus;
