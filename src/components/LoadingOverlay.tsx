import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * LoadingOverlay component displays a loading indicator
 * Used for async operations like room creation, joining, and game start
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <svg 
            className="animate-spin h-12 w-12 text-blue-600" 
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
          
          {/* Loading message */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-1">
              {message}
            </p>
            <p className="text-sm text-gray-600">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
