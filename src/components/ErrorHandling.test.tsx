import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConnectionStatus from './ConnectionStatus';
import LoadingOverlay from './LoadingOverlay';
import ErrorMessage from './ErrorMessage';

describe('Error Handling Components', () => {
  describe('ConnectionStatus', () => {
    it('should display reconnecting indicator when status is reconnecting', () => {
      render(<ConnectionStatus status="reconnecting" />);
      
      expect(screen.getByText(/Reconnecting to server/i)).toBeInTheDocument();
      expect(screen.getByText(/Please wait while we restore your connection/i)).toBeInTheDocument();
    });

    it('should display disconnected warning when status is disconnected', () => {
      render(<ConnectionStatus status="disconnected" />);
      
      expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
      expect(screen.getByText(/Attempting to reconnect/i)).toBeInTheDocument();
    });

    it('should display success message after reconnection', async () => {
      const { rerender } = render(<ConnectionStatus status="reconnecting" />);
      
      // Change status to connected
      rerender(<ConnectionStatus status="connected" />);
      
      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/Reconnected successfully/i)).toBeInTheDocument();
      });
    });

    it('should call onReconnectSuccess callback after successful reconnection', async () => {
      const onReconnectSuccess = jest.fn();
      const { rerender } = render(
        <ConnectionStatus status="reconnecting" onReconnectSuccess={onReconnectSuccess} />
      );
      
      // Change status to connected
      rerender(<ConnectionStatus status="connected" onReconnectSuccess={onReconnectSuccess} />);
      
      await waitFor(() => {
        expect(onReconnectSuccess).toHaveBeenCalled();
      });
    });

    it('should not display anything when status is connected (without prior reconnection)', () => {
      const { container } = render(<ConnectionStatus status="connected" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should hide success message after 3 seconds', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(<ConnectionStatus status="reconnecting" />);
      rerender(<ConnectionStatus status="connected" />);
      
      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/Reconnected successfully/i)).toBeInTheDocument();
      });
      
      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText(/Reconnected successfully/i)).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('LoadingOverlay', () => {
    it('should display loading overlay when isLoading is true', () => {
      render(<LoadingOverlay isLoading={true} message="Creating room..." />);
      
      expect(screen.getByText(/Creating room/i)).toBeInTheDocument();
      expect(screen.getByText(/Please wait/i)).toBeInTheDocument();
    });

    it('should not display loading overlay when isLoading is false', () => {
      const { container } = render(<LoadingOverlay isLoading={false} message="Loading..." />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should display default message when no message is provided', () => {
      render(<LoadingOverlay isLoading={true} />);
      
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<LoadingOverlay isLoading={true} message="Loading..." />);
      
      const overlay = screen.getByRole('status');
      expect(overlay).toHaveAttribute('aria-live', 'polite');
      expect(overlay).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('ErrorMessage', () => {
    it('should display error message when error is provided', () => {
      render(<ErrorMessage error="Something went wrong" />);
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should not display anything when error is null', () => {
      const { container } = render(<ErrorMessage error={null} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should display user-friendly message for "Room is full" error', () => {
      render(<ErrorMessage error="Room is full" />);
      
      expect(screen.getByText(/Room is Full/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum number of players/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for "Room not found" error', () => {
      render(<ErrorMessage error="Room not found" />);
      
      expect(screen.getByText(/Room Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for connection errors', () => {
      render(<ErrorMessage error="Not connected to server" />);
      
      expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for "Not your turn" error', () => {
      render(<ErrorMessage error="Not your turn" />);
      
      expect(screen.getByText(/Not Your Turn/i)).toBeInTheDocument();
      expect(screen.getByText(/wait for your turn/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for "Only host can start" error', () => {
      render(<ErrorMessage error="Only host can start game" />);
      
      expect(screen.getByText(/Host Only/i)).toBeInTheDocument();
      expect(screen.getByText(/wait for the host/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for timeout errors', () => {
      render(<ErrorMessage error="Request timed out" />);
      
      expect(screen.getByText(/Request Timeout/i)).toBeInTheDocument();
      expect(screen.getByText(/took too long to respond/i)).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      render(<ErrorMessage error="Test error" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByLabelText(/Dismiss error/i);
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not display dismiss button when onDismiss is not provided', () => {
      render(<ErrorMessage error="Test error" />);
      
      expect(screen.queryByLabelText(/Dismiss error/i)).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<ErrorMessage error="Test error" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
