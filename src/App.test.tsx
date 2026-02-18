import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock SocketManager for App tests
jest.mock('./services/SocketManager', () => ({
  socketManager: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    startGame: jest.fn(),
    playCard: jest.fn(),
    addBot: jest.fn(),
    onPlayerJoined: jest.fn(),
    onGameStarted: jest.fn(),
    onGameStateUpdated: jest.fn(),
    onPlayerReconnected: jest.fn(),
    onPlayerDisconnected: jest.fn(),
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onConnectionStatusChange: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => false),
    getConnectionStatus: jest.fn(() => 'disconnected')
  },
  SocketManager: jest.fn(),
  ConnectionStatus: 'connected' as const
}));

test('renders game setup screen', () => {
  render(<App />);
  const titleElement = screen.getByText(/Beriz Jhabbu/i);
  expect(titleElement).toBeInTheDocument();
  
  const createRoomButton = screen.getByText(/Create Room/i);
  expect(createRoomButton).toBeInTheDocument();
});
