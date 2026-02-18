import React from 'react';

interface ErrorMessageProps {
  error: string | null;
  onDismiss?: () => void;
}

/**
 * ErrorMessage component displays user-friendly error messages
 * Provides context-specific messages for common errors
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  if (!error) {
    return null;
  }

  // Map technical errors to user-friendly messages
  const getUserFriendlyMessage = (errorMsg: string): { title: string; message: string } => {
    const lowerError = errorMsg.toLowerCase();

    if (lowerError.includes('room is full') || lowerError.includes('full room')) {
      return {
        title: 'Room is Full',
        message: 'This game room has reached its maximum number of players. Please try joining a different room or create your own.'
      };
    }

    if (lowerError.includes('room not found') || lowerError.includes('not found')) {
      return {
        title: 'Room Not Found',
        message: 'The room code you entered doesn\'t exist. Please check the code and try again, or create a new room.'
      };
    }

    if (lowerError.includes('not connected') || lowerError.includes('connection')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the game server. Please check your internet connection and try again.'
      };
    }

    if (lowerError.includes('not your turn')) {
      return {
        title: 'Not Your Turn',
        message: 'Please wait for your turn to play a card.'
      };
    }

    if (lowerError.includes('only host can start')) {
      return {
        title: 'Host Only',
        message: 'Only the room host can start the game. Please wait for the host to begin.'
      };
    }

    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return {
        title: 'Request Timeout',
        message: 'The server took too long to respond. Please try again.'
      };
    }

    // Default error message
    return {
      title: 'Error',
      message: errorMsg
    };
  };

  const { title, message } = getUserFriendlyMessage(error);

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border-2 border-red-400 rounded-lg shadow-lg p-4 max-w-md w-full mx-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            {title}
          </h3>
          <p className="text-sm text-red-700">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
            aria-label="Dismiss error"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
