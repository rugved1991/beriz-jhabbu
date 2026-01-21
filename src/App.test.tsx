import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders game setup screen', () => {
  render(<App />);
  const titleElement = screen.getByText(/Beriz Jhabbu/i);
  expect(titleElement).toBeInTheDocument();
  
  const createRoomButton = screen.getByText(/Create Room/i);
  expect(createRoomButton).toBeInTheDocument();
});
